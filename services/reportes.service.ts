import { AuthError } from "@/lib/auth/errors";
import { loadAuthContext } from "@/lib/auth/load-context";
import {
  canAccessContrato,
  canAccessInmueble,
  filterContratos,
  filterInmuebles,
  filterMantenimiento,
  filterNoRenovacion,
  filterPagos,
  filterPagosServicio,
} from "@/lib/auth/scopes";
import { auditActorFromUsuario } from "@/lib/audit/actor";
import { traceEvento } from "@/lib/audit/trace-helper";
import { crearBaseReporte, firmasDesdeContrato } from "@/lib/reportes/base-reporte";
import {
  aplicarFiltrosEventos,
  filtrosAplicadosLabels,
} from "@/lib/reportes/filtros-eventos";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  getContratosRepository,
  getInmueblesRepository,
  getMantenimientoRepository,
  getNoRenovacionRepository,
  getNotificacionesRepository,
  getPagosRepository,
  getPagosServicioRepository,
  getServiciosContratoRepository,
  getUsuariosRepository,
} from "@/repositories";
import { assertModuleAccess, requireSession } from "@/services/auth.service";
import {
  listarEventosPorContrato,
  listarEventosPorInmueble,
  listarHistorialNoRenovacion,
} from "@/services/trazabilidad.service";
import type { ArchivoAdjunto, NoRenovacion } from "@/types";
import type { FiltrosReporte, ReporteDocumento, ReporteSeccion } from "@/types/reportes";
import type { EventoTrazabilidad } from "@/types/trazabilidad";

async function ctxReportes() {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "reportes");
  const { contratos, inmuebles } = await loadAuthContext();
  return { usuario, contratos, inmuebles };
}

async function assertContrato(contratoId: string) {
  const { usuario, contratos } = await ctxReportes();
  const contrato = contratos.find((c) => c.id === contratoId) ??
    (await getContratosRepository().findById(contratoId));
  if (!contrato || !canAccessContrato(contrato, usuario)) {
    throw new AuthError("Contrato no encontrado o sin permiso", "FORBIDDEN");
  }
  return { usuario, contrato, contratos };
}

function recolectarAdjuntos(...listas: (ArchivoAdjunto[] | undefined)[]): ArchivoAdjunto[] {
  const map = new Map<string, ArchivoAdjunto>();
  for (const lista of listas) {
    for (const a of lista ?? []) {
      map.set(a.id, a);
    }
  }
  return [...map.values()];
}

export async function registrarReporteGenerado(
  reporte: ReporteDocumento,
  filtros: Partial<FiltrosReporte>
) {
  const { usuario } = await requireSession();
  const actor = auditActorFromUsuario(usuario);
  await traceEvento(actor, {
    entidadTipo: "USUARIO",
    entidadId: usuario.id,
    accion: "REPORTE_GENERADO",
    descripcion: `Reporte generado: ${reporte.titulo}`,
    contexto: {
      contratoId: filtros.contratoId,
      inmuebleId: filtros.inmuebleId,
    },
    metadata: {
      tipoReporte: reporte.tipo,
      filtrosAplicados: filtrosAplicadosLabels(filtros),
      generadoPor: usuario.email,
      fechaGeneracion: reporte.fechaGeneracion,
    },
  });
}

export async function obtenerReporte(filtros: FiltrosReporte): Promise<ReporteDocumento> {
  switch (filtros.tipoReporte) {
    case "HISTORIAL_CONTRATO":
      return obtenerReporteHistorialContrato(filtros);
    case "HISTORIAL_INMUEBLE":
      return obtenerReporteHistorialInmueble(filtros);
    case "ESTADO_CUENTA":
      return obtenerReporteEstadoCuentaContrato(filtros);
    case "PAGOS_CANON":
      return obtenerReportePagosCanon(filtros);
    case "SERVICIOS_PUBLICOS":
      return obtenerReporteServiciosPublicos(filtros);
    case "MANTENIMIENTO":
      return obtenerReporteMantenimiento(filtros);
    case "NO_RENOVACION":
      return obtenerReporteNoRenovacion(filtros);
    case "TRAZABILIDAD_GLOBAL":
      return obtenerReporteTrazabilidadGlobal(filtros);
    case "CONTRATOS_VENCER":
      return obtenerReporteContratosProximosVencer(filtros);
    case "CARTERA_BASICA":
      return obtenerReporteCarteraBasica(filtros);
    default:
      throw new AuthError("Tipo de reporte no válido", "FORBIDDEN");
  }
}

export async function obtenerReporteHistorialContrato(
  filtros: FiltrosReporte
): Promise<ReporteDocumento> {
  if (!filtros.contratoId) {
    throw new AuthError("Seleccione un contrato", "FORBIDDEN");
  }
  const { usuario, contrato } = await assertContrato(filtros.contratoId);
  const inmueble = await getInmueblesRepository().findById(contrato.inmuebleId);
  const pagos = (await getPagosRepository().findAll()).filter(
    (p) => p.contratoId === contrato.id
  );
  const servicios = (await getServiciosContratoRepository().findAll()).filter(
    (s) => s.contratoId === contrato.id
  );
  const pagosSrv = (await getPagosServicioRepository().findAll()).filter(
    (p) => p.contratoId === contrato.id
  );
  const mantenimientos = (await getMantenimientoRepository().findAll()).filter(
    (m) => m.inmuebleId === contrato.inmuebleId
  );
  const noRenovaciones = (await getNoRenovacionRepository().findAll()).filter(
    (n) => n.contratoId === contrato.id
  );
  const notificaciones = (await getNotificacionesRepository().findAll()).filter(
    (n) => n.contratoId === contrato.id
  );

  let eventos = await listarEventosPorContrato(contrato.id);
  eventos = aplicarFiltrosEventos(eventos, filtros);

  const nrEnvio = noRenovaciones.find((n) => n.estado === "ENVIO_REGISTRADO");
  const secciones: ReporteSeccion[] = [
    {
      id: "contrato",
      titulo: "Datos principales del contrato",
      filas: [
        { etiqueta: "Código", valor: contrato.code },
        { etiqueta: "Inmueble", valor: inmueble?.titulo ?? contrato.inmuebleId },
        { etiqueta: "Dirección", valor: inmueble ? `${inmueble.direccion}, ${inmueble.ciudad}` : "—" },
        { etiqueta: "Arrendador", valor: contrato.nombreArrendador ?? "—" },
        {
          etiqueta: "Documento arrendador",
          valor: contrato.numeroDocumentoArrendador
            ? `${contrato.tipoDocumentoArrendador ?? "CC"} ${contrato.numeroDocumentoArrendador}`
            : "—",
        },
        { etiqueta: "Arrendatario", valor: contrato.nombreArrendatario ?? contrato.emailArrendatario },
        {
          etiqueta: "Documento arrendatario",
          valor: contrato.numeroDocumentoArrendatario
            ? `${contrato.tipoDocumentoArrendatario ?? "CC"} ${contrato.numeroDocumentoArrendatario}`
            : "—",
        },
        { etiqueta: "Inicio", valor: formatDate(contrato.fechaInicio) },
        { etiqueta: "Fin", valor: formatDate(contrato.fechaFin) },
        { etiqueta: "Canon", valor: formatCurrency(contrato.canonActual) },
        { etiqueta: "Estado", valor: contrato.estado },
        { etiqueta: "Prórroga automática", valor: contrato.prorrogaAutomatica ? "Sí" : "No" },
        { etiqueta: "Límite preaviso", valor: formatDate(contrato.fechaLimitePreaviso) },
        { etiqueta: "No renovación registrada", valor: contrato.noRenovar ? "Sí" : "No" },
      ],
    },
    {
      id: "documentos",
      titulo: "Documentos adjuntos del contrato",
      tabla: {
        columnas: ["Nombre", "Fecha", "Descripción"],
        filas: (contrato.documentosAdjuntos ?? []).map((a) => [
          a.nombre,
          formatDate(a.fechaCarga.slice(0, 10)),
          a.descripcion ?? "—",
        ]),
      },
    },
    {
      id: "pagos",
      titulo: "Pagos del canon",
      tabla: {
        columnas: ["Código", "Mes", "Monto", "Estado", "Fecha reporte"],
        filas: pagos.map((p) => [
          p.code,
          p.mes,
          formatCurrency(p.monto),
          p.estado,
          formatDate(p.fechaReporte),
        ]),
      },
    },
    {
      id: "servicios",
      titulo: "Servicios públicos",
      tabla: {
        columnas: ["Servicio", "Empresa", "Cuenta", "Activo"],
        filas: servicios.map((s) => [
          s.tipoServicio,
          s.empresaPrestadora,
          s.numeroCuentaServicio,
          s.activo ? "Sí" : "No",
        ]),
      },
    },
    {
      id: "pagos-servicios",
      titulo: "Pagos de servicios públicos",
      tabla: {
        columnas: ["Código", "Periodo", "Valor", "Estado", "Vencimiento"],
        filas: pagosSrv.map((p) => [
          p.code,
          p.periodo,
          formatCurrency(p.valorPagado),
          p.estado,
          formatDate(p.fechaVencimiento),
        ]),
      },
    },
    {
      id: "mantenimiento",
      titulo: "Mantenimientos",
      tabla: {
        columnas: ["Código", "Título", "Estado", "Responsabilidad"],
        filas: mantenimientos.map((m) => [
          m.code,
          m.titulo,
          m.estado,
          m.tipoResponsabilidad ?? "—",
        ]),
      },
    },
    {
      id: "no-renovacion",
      titulo: "No renovación",
      filas: nrEnvio
        ? [
            { etiqueta: "Expediente", valor: nrEnvio.code },
            { etiqueta: "Iniciado por", valor: `${nrEnvio.iniciadoPorNombre} (${nrEnvio.iniciadoPorRol})` },
            { etiqueta: "Destinatario", valor: nrEnvio.destinatarioNombre },
            { etiqueta: "Fecha envío", valor: formatDate(nrEnvio.fechaEnvioRegistrado?.slice(0, 10) ?? "") },
            { etiqueta: "Medio", valor: nrEnvio.medioEnvio ?? "—" },
            { etiqueta: "Mensajería", valor: nrEnvio.empresaMensajeria ?? "—" },
            { etiqueta: "Guía", valor: nrEnvio.numeroGuiaCorreoCertificado ?? "—" },
            {
              etiqueta: "Evidencias",
              valor: String(nrEnvio.evidenciaEnvioAdjuntos?.length ?? 0),
            },
          ]
        : noRenovaciones.length
          ? [{ etiqueta: "Expedientes", valor: noRenovaciones.map((n) => n.code).join(", ") }]
          : [{ etiqueta: "Estado", valor: "Sin comunicación registrada" }],
      texto: nrEnvio?.cuerpoComunicacionGenerado?.slice(0, 500),
    },
    {
      id: "notificaciones",
      titulo: "Notificaciones",
      tabla: {
        columnas: ["Asunto", "Destinatario", "Estado", "Fecha"],
        filas: notificaciones.map((n) => [
          n.asunto,
          n.destinatarioEmail,
          n.estado,
          formatDate(n.fechaCreacion),
        ]),
      },
    },
    {
      id: "timeline",
      titulo: "Línea de tiempo de trazabilidad",
      descripcion: `${eventos.length} evento(s) registrado(s)`,
    },
  ];

  const adjuntos = recolectarAdjuntos(
    contrato.documentosAdjuntos,
    pagos.flatMap((p) => p.comprobantesAdjuntos ?? []),
    pagosSrv.flatMap((p) => p.comprobantesAdjuntos ?? []),
    mantenimientos.flatMap((m) => m.evidenciasAdjuntas ?? []),
    noRenovaciones.flatMap((n) => n.evidenciaEnvioAdjuntos ?? [])
  );

  return crearBaseReporte({
    tipo: "HISTORIAL_CONTRATO",
    titulo: "Historial completo del contrato",
    subtitulo: `Contrato ${contrato.code}`,
    usuario,
    filtros,
    resumen: [
      { etiqueta: "Total eventos", valor: String(eventos.length) },
      { etiqueta: "Pagos", valor: String(pagos.length) },
      { etiqueta: "Mantenimientos", valor: String(mantenimientos.length) },
    ],
    secciones,
    eventos,
    adjuntos,
    firmas: firmasDesdeContrato(contrato, usuario),
  });
}

export async function obtenerReporteHistorialInmueble(
  filtros: FiltrosReporte
): Promise<ReporteDocumento> {
  if (!filtros.inmuebleId) {
    throw new AuthError("Seleccione un inmueble", "FORBIDDEN");
  }
  const { usuario, contratos, inmuebles } = await ctxReportes();
  const inmueble = inmuebles.find((i) => i.id === filtros.inmuebleId) ??
    (await getInmueblesRepository().findById(filtros.inmuebleId!));
  if (!inmueble || !filterInmuebles([inmueble], usuario).length) {
    throw new AuthError("Inmueble no encontrado o sin permiso", "FORBIDDEN");
  }

  const contratosInm = filterContratos(contratos, usuario).filter(
    (c) => c.inmuebleId === inmueble.id
  );
  let eventos = await listarEventosPorInmueble(inmueble.id);
  eventos = aplicarFiltrosEventos(eventos, filtros);

  const mantenimientos = filterMantenimiento(
    await getMantenimientoRepository().findAll(),
    usuario,
    inmuebles,
    contratos
  ).filter((m) => m.inmuebleId === inmueble.id);

  const noRenovaciones = filterNoRenovacion(
    await getNoRenovacionRepository().findAll(),
    usuario,
    contratos
  ).filter((n) => n.inmuebleId === inmueble.id);

  const usuarios = await getUsuariosRepository().findAll();
  const arrendador = usuarios.find((u) => u.id === inmueble.arrendadorId);

  return crearBaseReporte({
    tipo: "HISTORIAL_INMUEBLE",
    titulo: "Historial del inmueble",
    subtitulo: inmueble.titulo,
    usuario,
    filtros,
    resumen: [
      { etiqueta: "Contratos", valor: String(contratosInm.length) },
      { etiqueta: "Eventos", valor: String(eventos.length) },
    ],
    secciones: [
      {
        id: "inmueble",
        titulo: "Datos del inmueble",
        filas: [
          { etiqueta: "Título", valor: inmueble.titulo },
          { etiqueta: "Dirección", valor: `${inmueble.direccion}, ${inmueble.ciudad}` },
          { etiqueta: "Arrendador", valor: arrendador?.nombre ?? inmueble.arrendadorId },
          { etiqueta: "Estado", valor: inmueble.estado },
        ],
      },
      {
        id: "contratos",
        titulo: "Contratos asociados",
        tabla: {
          columnas: ["Código", "Arrendatario", "Estado", "Fin"],
          filas: contratosInm.map((c) => [
            c.code,
            c.nombreArrendatario ?? c.emailArrendatario,
            c.estado,
            formatDate(c.fechaFin),
          ]),
        },
      },
      {
        id: "mantenimiento",
        titulo: "Mantenimientos",
        tabla: {
          columnas: ["Código", "Título", "Estado"],
          filas: mantenimientos.map((m) => [m.code, m.titulo, m.estado]),
        },
      },
      {
        id: "nr",
        titulo: "No renovaciones",
        tabla: {
          columnas: ["Código", "Estado", "Iniciado por"],
          filas: noRenovaciones.map((n) => [
            n.code,
            n.estado,
            n.iniciadoPorNombre,
          ]),
        },
      },
    ],
    eventos,
    adjuntos: recolectarAdjuntos(
      mantenimientos.flatMap((m) => m.evidenciasAdjuntas ?? []),
      noRenovaciones.flatMap((n) => n.evidenciaEnvioAdjuntos ?? [])
    ),
    firmas: arrendador
      ? [{ rol: "ARRENDADOR", nombre: arrendador.nombre }]
      : [],
  });
}

export async function obtenerReporteEstadoCuentaContrato(
  filtros: FiltrosReporte
): Promise<ReporteDocumento> {
  if (!filtros.contratoId) throw new AuthError("Seleccione un contrato", "FORBIDDEN");
  const { usuario, contrato } = await assertContrato(filtros.contratoId);

  const pagos = (await getPagosRepository().findAll()).filter(
    (p) => p.contratoId === contrato.id
  );
  const pagosSrv = (await getPagosServicioRepository().findAll()).filter(
    (p) => p.contratoId === contrato.id
  );

  const validados = pagos.filter((p) => p.estado === "VALIDADO");
  const pendientes = pagos.filter((p) => p.estado === "REPORTADO");
  const rechazados = pagos.filter((p) => p.estado === "RECHAZADO");
  const srvPend = pagosSrv.filter(
    (p) => p.estado === "REPORTADO" || p.estado === "PENDIENTE"
  );
  const srvVenc = pagosSrv.filter((p) => p.estado === "VENCIDO");

  const totalValidado =
    validados.reduce((s, p) => s + p.monto, 0) +
    pagosSrv
      .filter((p) => p.estado === "VALIDADO")
      .reduce((s, p) => s + p.valorPagado, 0);
  const totalPendiente =
    pendientes.reduce((s, p) => s + p.monto, 0) +
    srvPend.reduce((s, p) => s + p.valorPagado, 0);

  return crearBaseReporte({
    tipo: "ESTADO_CUENTA",
    titulo: "Estado de cuenta del contrato",
    subtitulo: contrato.code,
    usuario,
    filtros,
    resumen: [
      { etiqueta: "Canon mensual", valor: formatCurrency(contrato.canonActual) },
      { etiqueta: "Total validado", valor: formatCurrency(totalValidado) },
      { etiqueta: "Total pendiente", valor: formatCurrency(totalPendiente) },
    ],
    secciones: [
      {
        id: "resumen-pagos",
        titulo: "Pagos del canon",
        filas: [
          { etiqueta: "Validados", valor: String(validados.length) },
          { etiqueta: "Reportados (pendientes)", valor: String(pendientes.length) },
          { etiqueta: "Rechazados", valor: String(rechazados.length) },
        ],
      },
      {
        id: "servicios",
        titulo: "Servicios públicos",
        filas: [
          { etiqueta: "Pendientes de validación", valor: String(srvPend.length) },
          { etiqueta: "Vencidos", valor: String(srvVenc.length) },
        ],
      },
    ],
    eventos: await listarEventosPorContrato(contrato.id),
    firmas: firmasDesdeContrato(contrato, usuario),
  });
}

export async function obtenerReportePagosCanon(
  filtros: FiltrosReporte
): Promise<ReporteDocumento> {
  if (!filtros.contratoId) throw new AuthError("Seleccione un contrato", "FORBIDDEN");
  const { usuario, contrato, contratos } = await assertContrato(filtros.contratoId);

  let pagos = filterPagos(await getPagosRepository().findAll(), usuario, contratos).filter(
    (p) => p.contratoId === contrato.id
  );
  if (filtros.estadoPago) {
    pagos = pagos.filter((p) => p.estado === filtros.estadoPago);
  }

  const eventos = aplicarFiltrosEventos(
    (await listarEventosPorContrato(contrato.id)).filter(
      (e) => e.entidadTipo === "PAGO" || e.accion.startsWith("PAGO_")
    ),
    filtros
  );

  return crearBaseReporte({
    tipo: "PAGOS_CANON",
    titulo: "Reporte de pagos del canon",
    subtitulo: contrato.code,
    usuario,
    filtros,
    resumen: [{ etiqueta: "Registros", valor: String(pagos.length) }],
    secciones: [
      {
        id: "tabla",
        titulo: "Pagos",
        tabla: {
          columnas: ["Periodo", "Valor", "Estado", "Comprobantes", "Validación"],
          filas: pagos.map((p) => [
            p.mes,
            formatCurrency(p.monto),
            p.estado,
            String(p.comprobantesAdjuntos?.length ?? 0),
            p.fechaValidacion ? formatDate(p.fechaValidacion) : "—",
          ]),
        },
      },
    ],
    eventos,
    adjuntos: recolectarAdjuntos(pagos.flatMap((p) => p.comprobantesAdjuntos ?? [])),
    firmas: firmasDesdeContrato(contrato, usuario),
  });
}

export async function obtenerReporteServiciosPublicos(
  filtros: FiltrosReporte
): Promise<ReporteDocumento> {
  if (!filtros.contratoId) throw new AuthError("Seleccione un contrato", "FORBIDDEN");
  const { usuario, contrato, contratos } = await assertContrato(filtros.contratoId);

  const servicios = (await getServiciosContratoRepository().findAll()).filter(
    (s) => s.contratoId === contrato.id
  );
  let pagosSrv = filterPagosServicio(
    await getPagosServicioRepository().findAll(),
    usuario,
    contratos
  ).filter((p) => p.contratoId === contrato.id);
  if (filtros.estadoServicio) {
    pagosSrv = pagosSrv.filter((p) => p.estado === filtros.estadoServicio);
  }

  return crearBaseReporte({
    tipo: "SERVICIOS_PUBLICOS",
    titulo: "Reporte de servicios públicos",
    subtitulo: contrato.code,
    usuario,
    filtros,
    resumen: [
      { etiqueta: "Servicios activos", valor: String(servicios.filter((s) => s.activo).length) },
      { etiqueta: "Pagos registrados", valor: String(pagosSrv.length) },
    ],
    secciones: [
      {
        id: "servicios",
        titulo: "Servicios configurados",
        tabla: {
          columnas: ["Tipo", "Empresa", "Cuenta", "Periodicidad"],
          filas: servicios.map((s) => [
            s.tipoServicio,
            s.empresaPrestadora,
            s.numeroCuentaServicio,
            s.periodicidad,
          ]),
        },
      },
      {
        id: "pagos",
        titulo: "Pagos por periodo",
        tabla: {
          columnas: ["Periodo", "Valor", "Estado", "Vencimiento", "Motivo rechazo"],
          filas: pagosSrv.map((p) => [
            p.periodo,
            formatCurrency(p.valorPagado),
            p.estado,
            formatDate(p.fechaVencimiento),
            p.motivoRechazo ?? "—",
          ]),
        },
      },
    ],
    eventos: aplicarFiltrosEventos(
      (await listarEventosPorContrato(contrato.id)).filter((e) =>
        e.accion.includes("SERVICIO") || e.accion.includes("PAGO_SERVICIO")
      ),
      filtros
    ),
    adjuntos: recolectarAdjuntos(pagosSrv.flatMap((p) => p.comprobantesAdjuntos ?? [])),
    firmas: firmasDesdeContrato(contrato, usuario),
  });
}

export async function obtenerReporteMantenimiento(
  filtros: FiltrosReporte
): Promise<ReporteDocumento> {
  const { usuario, contratos, inmuebles } = await ctxReportes();
  const mantId = filtros.mantenimientoId;
  const inmuebleId = filtros.inmuebleId;

  let items = filterMantenimiento(
    await getMantenimientoRepository().findAll(),
    usuario,
    inmuebles,
    contratos
  );
  if (mantId) items = items.filter((m) => m.id === mantId);
  if (inmuebleId) items = items.filter((m) => m.inmuebleId === inmuebleId);
  if (filtros.estadoMantenimiento) {
    items = items.filter((m) => m.estado === filtros.estadoMantenimiento);
  }

  const m = items[0];
  const contrato = m
    ? contratos.find((c) => c.inmuebleId === m.inmuebleId && c.estado === "CONFIRMADO")
    : undefined;

  const eventos = m
    ? aplicarFiltrosEventos(
        (await listarEventosPorInmueble(m.inmuebleId)).filter(
          (e) => e.entidadTipo === "MANTENIMIENTO" && e.entidadId === m.id
        ),
        filtros
      )
    : [];

  return crearBaseReporte({
    tipo: "MANTENIMIENTO",
    titulo: "Reporte de mantenimiento",
    subtitulo: m?.code ?? "Listado",
    usuario,
    filtros,
    resumen: [{ etiqueta: "Tickets", valor: String(items.length) }],
    secciones: m
      ? [
          {
            id: "ticket",
            titulo: m.titulo,
            filas: [
              { etiqueta: "Estado", valor: m.estado },
              { etiqueta: "Tipo", valor: m.tipoMantenimiento ?? "—" },
              { etiqueta: "Responsabilidad", valor: m.tipoResponsabilidad ?? "—" },
              { etiqueta: "Valor estimado", valor: m.valorEstimado ? formatCurrency(m.valorEstimado) : "—" },
              { etiqueta: "Valor final", valor: m.valorFinal ? formatCurrency(m.valorFinal) : "—" },
              {
                etiqueta: "Aceptación compartida",
                valor: m.aceptacionArrendatario ?? "—",
              },
            ],
          },
        ]
      : [
          {
            id: "lista",
            titulo: "Tickets",
            tabla: {
              columnas: ["Código", "Título", "Estado"],
              filas: items.map((x) => [x.code, x.titulo, x.estado]),
            },
          },
        ],
    eventos,
    adjuntos: recolectarAdjuntos(
      items.flatMap((x) => x.evidenciasAdjuntas ?? []),
      items.flatMap((x) => x.documentosCierreAdjuntos ?? [])
    ),
    firmas: contrato ? firmasDesdeContrato(contrato, usuario) : [],
  });
}

export async function obtenerReporteNoRenovacion(
  filtros: FiltrosReporte
): Promise<ReporteDocumento> {
  const { usuario, contratos } = await ctxReportes();
  let nr: NoRenovacion | null = null;

  if (filtros.noRenovacionId) {
    nr = await getNoRenovacionRepository().findById(filtros.noRenovacionId);
  } else if (filtros.contratoId) {
    const list = filterNoRenovacion(
      await getNoRenovacionRepository().findAll(),
      usuario,
      contratos
    ).filter((n) => n.contratoId === filtros.contratoId);
    nr = list.sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion))[0] ?? null;
  }

  if (!nr) throw new AuthError("No hay expediente de no renovación", "FORBIDDEN");

  const contrato = contratos.find((c) => c.id === nr!.contratoId) ??
    (await getContratosRepository().findById(nr.contratoId));
  if (!contrato || !canAccessContrato(contrato, usuario)) {
    throw new AuthError("Sin permiso", "FORBIDDEN");
  }

  const inmueble = await getInmueblesRepository().findById(nr.inmuebleId);
  const eventos = aplicarFiltrosEventos(
    await listarHistorialNoRenovacion(nr.id),
    filtros
  );

  return crearBaseReporte({
    tipo: "NO_RENOVACION",
    titulo: "Reporte de no renovación",
    subtitulo: nr.code,
    usuario,
    filtros,
    resumen: [
      { etiqueta: "Estado", valor: nr.estado },
      { etiqueta: "Envío", valor: nr.estadoEnvio },
    ],
    secciones: [
      {
        id: "partes",
        titulo: "Partes y contrato",
        filas: [
          { etiqueta: "Contrato", valor: contrato.code },
          { etiqueta: "Inmueble", valor: inmueble?.titulo ?? nr.inmuebleId },
          { etiqueta: "Iniciado por", valor: `${nr.iniciadoPorNombre} (${nr.iniciadoPorRol})` },
          { etiqueta: "Remitente", valor: `${nr.remitenteNombre} — ${nr.remitenteTipoDocumento} ${nr.remitenteNumeroDocumento}` },
          { etiqueta: "Destinatario", valor: `${nr.destinatarioNombre} — ${nr.destinatarioTipoDocumento} ${nr.destinatarioNumeroDocumento}` },
          { etiqueta: "Fin contrato", valor: formatDate(nr.fechaFinContrato) },
          { etiqueta: "Límite preaviso", valor: formatDate(nr.fechaLimitePreaviso ?? "") },
          {
            etiqueta: "Plazo preaviso",
            valor: nr.dentroDelPlazoPreaviso ? "Dentro del plazo" : "Fuera del plazo",
          },
        ],
      },
      {
        id: "envio",
        titulo: "Envío y evidencias",
        filas: [
          { etiqueta: "Medio", valor: nr.medioEnvio ?? "—" },
          { etiqueta: "Mensajería", valor: nr.empresaMensajeria ?? "—" },
          { etiqueta: "Guía correo certificado", valor: nr.numeroGuiaCorreoCertificado ?? "—" },
          { etiqueta: "Fecha envío", valor: formatDate(nr.fechaEnvioRegistrado?.slice(0, 10) ?? "") },
        ],
        texto:
          "Para efectos probatorios, se recomienda conservar el soporte de envío por correo certificado o medio formal pactado en el contrato.",
      },
      {
        id: "comunicacion",
        titulo: "Comunicación generada",
        texto: nr.cuerpoComunicacionGenerado ?? "Sin comunicación generada",
      },
    ],
    eventos,
    adjuntos: recolectarAdjuntos(
      nr.evidenciaEnvioAdjuntos,
      nr.documentoNoRenovacionAdjuntos
    ),
    firmas: firmasDesdeContrato(contrato, usuario),
  });
}

export async function obtenerReporteTrazabilidadGlobal(
  filtros: FiltrosReporte
): Promise<ReporteDocumento> {
  const { usuario, contratos, inmuebles } = await ctxReportes();
  const { filtrarPorAlcanceUsuario } = await import(
    "@/services/trazabilidad.service"
  );
  const { getTrazabilidadRepository } = await import("@/repositories");

  if (filtros.contratoId) {
    await assertContrato(filtros.contratoId);
  }
  if (filtros.inmuebleId) {
    const inm = inmuebles.find((i) => i.id === filtros.inmuebleId) ??
      (await getInmueblesRepository().findById(filtros.inmuebleId));
    if (!inm || !canAccessInmueble(inm, usuario, contratos)) {
      throw new AuthError("Inmueble no encontrado o sin permiso", "FORBIDDEN");
    }
  }

  let eventos = await filtrarPorAlcanceUsuario(
    await getTrazabilidadRepository().findAll()
  );

  if (filtros.contratoId) {
    eventos = eventos.filter((e) => e.contratoId === filtros.contratoId);
  }
  if (filtros.inmuebleId) {
    eventos = eventos.filter((e) => e.inmuebleId === filtros.inmuebleId);
  }
  eventos = aplicarFiltrosEventos(eventos, filtros);

  return crearBaseReporte({
    tipo: "TRAZABILIDAD_GLOBAL",
    titulo: "Reporte global de trazabilidad",
    usuario,
    filtros,
    resumen: [{ etiqueta: "Eventos", valor: String(eventos.length) }],
    secciones: [
      {
        id: "tabla",
        titulo: "Eventos",
        tabla: {
          columnas: ["Fecha", "Usuario", "Rol", "Entidad", "Acción", "Descripción"],
          filas: eventos.slice(0, 100).map((e) => [
            formatDate(e.fechaHora.slice(0, 10)),
            e.usuarioNombre,
            e.usuarioRol,
            `${e.entidadTipo} ${e.entidadId}`,
            e.accion,
            e.descripcion.slice(0, 60),
          ]),
        },
      },
    ],
    eventos,
    firmas: [],
  });
}

export async function obtenerReporteContratosProximosVencer(
  filtros: FiltrosReporte
): Promise<ReporteDocumento> {
  const { usuario, contratos } = await ctxReportes();
  const hoy = new Date();
  const limite = new Date(hoy);
  limite.setDate(limite.getDate() + 90);

  const noRenovaciones = await getNoRenovacionRepository().findAll();

  const filas = filterContratos(contratos, usuario)
    .filter((c) => c.estado === "CONFIRMADO")
    .map((c) => {
      const fin = new Date(c.fechaFin + "T12:00:00");
      const dias = Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      const nr = noRenovaciones.find((n) => n.contratoId === c.id);
      return {
        c,
        dias,
        nr,
      };
    })
    .filter((x) => x.dias >= 0 && x.dias <= 90)
    .sort((a, b) => a.dias - b.dias);

  return crearBaseReporte({
    tipo: "CONTRATOS_VENCER",
    titulo: "Contratos próximos a vencer",
    usuario,
    filtros,
    resumen: [{ etiqueta: "Contratos (90 días)", valor: String(filas.length) }],
    secciones: [
      {
        id: "lista",
        titulo: "Contratos",
        tabla: {
          columnas: [
            "Contrato",
            "Fin",
            "Días restantes",
            "Preaviso límite",
            "No renovación",
            "Acción",
          ],
          filas: filas.map(({ c, dias, nr }) => [
            c.code,
            formatDate(c.fechaFin),
            String(dias),
            formatDate(c.fechaLimitePreaviso),
            nr?.estado ?? (c.noRenovar ? "Marcado" : "—"),
            dias <= 30 ? "Revisar renovación / no renovación" : "Monitorear",
          ]),
        },
      },
    ],
    eventos: [],
    firmas: [],
  });
}

export async function obtenerReporteCarteraBasica(
  filtros: FiltrosReporte
): Promise<ReporteDocumento> {
  const { usuario, contratos, inmuebles } = await ctxReportes();
  const hoy = new Date().toISOString().slice(0, 10);

  const pagos = filterPagos(await getPagosRepository().findAll(), usuario, contratos).filter(
    (p) => p.estado === "REPORTADO"
  );
  const pagosSrv = filterPagosServicio(
    await getPagosServicioRepository().findAll(),
    usuario,
    contratos
  ).filter((p) => p.estado === "REPORTADO" || p.estado === "VENCIDO");

  const filas: string[][] = [];

  for (const p of pagos) {
    const c = contratos.find((x) => x.id === p.contratoId);
    const inm = inmuebles.find((i) => i.id === c?.inmuebleId);
    filas.push([
      "Canon",
      c?.code ?? p.contratoId,
      inm?.titulo ?? "—",
      c?.nombreArrendatario ?? "—",
      formatCurrency(p.monto),
      p.estado,
      "—",
    ]);
  }

  for (const p of pagosSrv) {
    const c = contratos.find((x) => x.id === p.contratoId);
    const inm = inmuebles.find((i) => i.id === p.inmuebleId);
    const dias =
      p.estado === "VENCIDO"
        ? String(
            Math.ceil(
              (new Date(hoy).getTime() - new Date(p.fechaVencimiento).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : "—";
    filas.push([
      "Servicio",
      c?.code ?? p.contratoId,
      inm?.titulo ?? "—",
      c?.nombreArrendatario ?? "—",
      formatCurrency(p.valorPagado),
      p.estado,
      dias,
    ]);
  }

  return crearBaseReporte({
    tipo: "CARTERA_BASICA",
    titulo: "Cartera básica / pendientes",
    usuario,
    filtros,
    resumen: [
      { etiqueta: "Ítems pendientes", valor: String(filas.length) },
    ],
    secciones: [
      {
        id: "cartera",
        titulo: "Pendientes de validación o vencidos",
        tabla: {
          columnas: [
            "Tipo",
            "Contrato",
            "Inmueble",
            "Arrendatario",
            "Valor",
            "Estado",
            "Días vencidos",
          ],
          filas,
        },
      },
    ],
    eventos: [],
    firmas: [],
  });
}

/** Opciones para filtros en UI */
export async function listarOpcionesReportes() {
  const { usuario, contratos, inmuebles } = await ctxReportes();
  const contratosScoped = filterContratos(contratos, usuario);
  const inmueblesScoped = filterInmuebles(inmuebles, usuario, contratosScoped);

  const noRenovaciones = filterNoRenovacion(
    await getNoRenovacionRepository().findAll(),
    usuario,
    contratos
  );

  return {
    contratos: contratosScoped,
    inmuebles: inmueblesScoped,
    noRenovaciones,
    mantenimientos: filterMantenimiento(
      await getMantenimientoRepository().findAll(),
      usuario,
      inmuebles,
      contratos
    ),
  };
}

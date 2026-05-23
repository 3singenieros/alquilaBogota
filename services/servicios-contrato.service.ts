import { AuthError } from "@/lib/auth/errors";
import { loadAuthContext } from "@/lib/auth/load-context";
import { canAccessContrato, filterContratos } from "@/lib/auth/scopes";
import { auditActorFromUsuario } from "@/lib/audit/actor";
import { contextoDesdeContrato } from "@/lib/audit/context";
import { traceCreado, traceEvento } from "@/lib/audit/trace-helper";
import {
  TIPO_SERVICIO_LABEL,
  labelServicioContrato,
} from "@/lib/servicios-labels";
import {
  getContratosRepository,
  getServiciosContratoRepository,
} from "@/repositories";
import { assertModuleAccess, requireSession } from "@/services/auth.service";
import type {
  Contrato,
  CreateInput,
  ServicioPublicoContrato,
  TipoServicioPublico,
  UpdateInput,
} from "@/types";

function rolEfectivo(usuario: { rol: string; rolActivo?: string }) {
  return usuario.rolActivo ?? usuario.rol;
}

async function assertContratoServicios(contratoId: string) {
  const { usuario } = await requireSession();
  const contrato = await getContratosRepository().findById(contratoId);
  if (!contrato || !canAccessContrato(contrato, usuario)) {
    throw new AuthError("Contrato no permitido", "FORBIDDEN");
  }
  return { usuario, contrato };
}

export async function listarServiciosContrato(contratoId?: string) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "servicios");
  const { contratos } = await loadAuthContext();
  const scopedContratos = filterContratos(contratos, usuario);
  const ids = new Set(scopedContratos.map((c) => c.id));

  const confirmados = new Set(
    scopedContratos.filter((c) => c.estado === "CONFIRMADO").map((c) => c.id)
  );
  const rol = rolEfectivo(usuario);

  const all = await getServiciosContratoRepository().findAll();
  return all.filter((s) => {
    if (!ids.has(s.contratoId)) return false;
    if (rol === "ARRENDATARIO" && !confirmados.has(s.contratoId)) return false;
    if (contratoId) return s.contratoId === contratoId;
    return true;
  });
}

export async function listarServiciosContratoPorContrato(contratoId: string) {
  await assertContratoServicios(contratoId);
  const items = await getServiciosContratoRepository().findByContratoId(contratoId);
  return items.filter((s) => s.activo || true);
}

export type ServicioContratoInput = {
  tipoServicio: TipoServicioPublico;
  empresaPrestadora: string;
  numeroCuentaServicio: string;
  periodicidad: ServicioPublicoContrato["periodicidad"];
  observaciones?: string;
};

export async function crearServicioContrato(
  contratoId: string,
  data: ServicioContratoInput
) {
  const { usuario, contrato } = await assertContratoServicios(contratoId);
  const rol = rolEfectivo(usuario);
  if (rol !== "ARRENDADOR" && rol !== "ADMIN") {
    throw new AuthError("Solo el arrendador puede configurar servicios del contrato", "FORBIDDEN");
  }

  const payload: CreateInput<ServicioPublicoContrato> = {
    contratoId,
    inmuebleId: contrato.inmuebleId,
    tipoServicio: data.tipoServicio,
    empresaPrestadora: data.empresaPrestadora.trim(),
    numeroCuentaServicio: data.numeroCuentaServicio.trim(),
    periodicidad: data.periodicidad,
    activo: true,
    observaciones: data.observaciones?.trim() || undefined,
  };

  const created = await getServiciosContratoRepository().create(payload);
  const actor = auditActorFromUsuario(usuario);
  const ctx = await contextoDesdeContrato(contratoId);
  const label = labelServicioContrato(created.tipoServicio, created.empresaPrestadora);

  await traceCreado(
    actor,
    "SERVICIO_PUBLICO",
    created.id,
    `El arrendador configuró el servicio ${label} para el contrato ${contrato.code}.`,
    ctx,
    "SERVICIO_CONTRATO_CREADO"
  );

  return created;
}

export async function actualizarServicioContrato(
  id: string,
  data: UpdateInput<ServicioPublicoContrato>
) {
  const existing = await getServiciosContratoRepository().findById(id);
  if (!existing) {
    throw new AuthError("Servicio no encontrado", "FORBIDDEN");
  }
  const { usuario, contrato } = await assertContratoServicios(existing.contratoId);
  const rol = rolEfectivo(usuario);
  if (rol !== "ARRENDADOR" && rol !== "ADMIN") {
    throw new AuthError("Solo el arrendador puede editar servicios del contrato", "FORBIDDEN");
  }

  const updated = await getServiciosContratoRepository().update(id, data);
  if (updated) {
    const actor = auditActorFromUsuario(usuario);
    const ctx = await contextoDesdeContrato(contrato.id);
    await traceEvento(actor, {
      entidadTipo: "SERVICIO_PUBLICO",
      entidadId: id,
      accion: "SERVICIO_CONTRATO_ACTUALIZADO",
      descripcion: `Servicio ${TIPO_SERVICIO_LABEL[updated.tipoServicio]} (${updated.empresaPrestadora}) actualizado en contrato ${contrato.code}.`,
      contexto: ctx,
      valoresAnteriores: { ...existing },
      valoresNuevos: { ...updated },
    });
  }
  return updated;
}

export async function inactivarServicioContrato(id: string) {
  const existing = await getServiciosContratoRepository().findById(id);
  if (!existing) return null;
  const { usuario, contrato } = await assertContratoServicios(existing.contratoId);
  const rol = rolEfectivo(usuario);
  if (rol !== "ARRENDADOR" && rol !== "ADMIN") {
    throw new AuthError("Solo el arrendador puede inactivar servicios", "FORBIDDEN");
  }

  const updated = await getServiciosContratoRepository().update(id, { activo: false });
  if (updated) {
    const actor = auditActorFromUsuario(usuario);
    const ctx = await contextoDesdeContrato(contrato.id);
    await traceEvento(actor, {
      entidadTipo: "SERVICIO_PUBLICO",
      entidadId: id,
      accion: "SERVICIO_CONTRATO_INACTIVADO",
      descripcion: `Servicio ${TIPO_SERVICIO_LABEL[updated.tipoServicio]} inactivado en contrato ${contrato.code}.`,
      estadoAnterior: "activo",
      estadoNuevo: "inactivo",
      contexto: ctx,
    });
  }
  return updated;
}

export async function configurarServiciosContrato(
  contratoId: string,
  servicios: ServicioContratoInput[]
) {
  const results: ServicioPublicoContrato[] = [];
  for (const s of servicios) {
    if (!s.empresaPrestadora?.trim() || !s.numeroCuentaServicio?.trim()) continue;
    results.push(await crearServicioContrato(contratoId, s));
  }
  return results;
}

export async function resolverServicioContrato(id: string) {
  return getServiciosContratoRepository().findById(id);
}

export async function serviciosActivosContratoConfirmado(contrato: Contrato) {
  if (contrato.estado !== "CONFIRMADO") return [];
  const items = await getServiciosContratoRepository().findByContratoId(contrato.id);
  return items.filter((s) => s.activo);
}

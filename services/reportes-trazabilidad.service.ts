import { AuthError } from "@/lib/auth/errors";
import { canAccessContrato } from "@/lib/auth/scopes";
import {
  getContratosRepository,
  getInmueblesRepository,
} from "@/repositories";
import { requireSession } from "@/services/auth.service";
import {
  listarEventosPorContrato,
  listarEventosPorInmueble,
} from "@/services/trazabilidad.service";
import type {
  AccionTrazabilidad,
  EventoTrazabilidad,
} from "@/types/trazabilidad";
import type { Contrato, Inmueble } from "@/types";

const ACCIONES_CRITICAS: AccionTrazabilidad[] = [
  "CONTRATO_ACEPTADO",
  "CONTRATO_RECHAZADO",
  "PAGO_VALIDADO",
  "PAGO_RECHAZADO",
  "NO_RENOVACION_SOLICITADA",
  "NO_RENOVACION_NOTIFICADA",
  "REAJUSTE_CANON_APLICADO",
  "SOPORTE_GENERADO",
];

export type ResumenTrazabilidad = {
  totalEventos: number;
  cambiosEstado: number;
  accionesCriticas: number;
  porAccion: Record<string, number>;
};

export type HistorialReporte = {
  entidadPrincipal: Contrato | Inmueble;
  tipo: "CONTRATO" | "INMUEBLE";
  eventos: EventoTrazabilidad[];
  resumen: ResumenTrazabilidad;
  cambiosEstado: EventoTrazabilidad[];
  accionesCriticas: EventoTrazabilidad[];
};

function construirResumen(eventos: EventoTrazabilidad[]): ResumenTrazabilidad {
  const porAccion: Record<string, number> = {};
  let cambiosEstado = 0;
  let accionesCriticas = 0;

  for (const e of eventos) {
    porAccion[e.accion] = (porAccion[e.accion] ?? 0) + 1;
    if (e.estadoAnterior && e.estadoNuevo) cambiosEstado++;
    if (ACCIONES_CRITICAS.includes(e.accion)) accionesCriticas++;
  }

  return {
    totalEventos: eventos.length,
    cambiosEstado,
    accionesCriticas,
    porAccion,
  };
}

export async function obtenerHistorialContratoParaReporte(
  contratoId: string
): Promise<HistorialReporte | null> {
  const { usuario } = await requireSession();
  const contrato = await getContratosRepository().findById(contratoId);
  if (!contrato || !canAccessContrato(contrato, usuario)) {
    throw new AuthError("Contrato no encontrado o sin permiso", "FORBIDDEN");
  }

  const eventos = await listarEventosPorContrato(contratoId);
  const cambiosEstado = eventos.filter(
    (e) => e.estadoAnterior && e.estadoNuevo
  );
  const accionesCriticas = eventos.filter((e) =>
    ACCIONES_CRITICAS.includes(e.accion)
  );

  return {
    entidadPrincipal: contrato,
    tipo: "CONTRATO",
    eventos,
    resumen: construirResumen(eventos),
    cambiosEstado,
    accionesCriticas,
  };
}

export async function obtenerHistorialInmuebleParaReporte(
  inmuebleId: string
): Promise<HistorialReporte | null> {
  const { usuario } = await requireSession();
  const inmueble = await getInmueblesRepository().findById(inmuebleId);
  if (!inmueble) {
    throw new AuthError("Inmueble no encontrado", "FORBIDDEN");
  }
  if (
    usuario.rol === "ARRENDADOR" &&
    inmueble.arrendadorId !== usuario.id
  ) {
    throw new AuthError("Sin permiso sobre este inmueble", "FORBIDDEN");
  }

  const eventos = await listarEventosPorInmueble(inmuebleId);
  const cambiosEstado = eventos.filter(
    (e) => e.estadoAnterior && e.estadoNuevo
  );
  const accionesCriticas = eventos.filter((e) =>
    ACCIONES_CRITICAS.includes(e.accion)
  );

  return {
    entidadPrincipal: inmueble,
    tipo: "INMUEBLE",
    eventos,
    resumen: construirResumen(eventos),
    cambiosEstado,
    accionesCriticas,
  };
}

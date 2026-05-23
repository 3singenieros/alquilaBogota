import {
  getContratosRepository,
  getInmueblesRepository,
  getMantenimientoRepository,
  getNoRenovacionRepository,
  getPagosRepository,
  getPagosServicioRepository,
  getServiciosContratoRepository,
} from "@/repositories";
import type { EntidadTipoTrazabilidad } from "@/types/trazabilidad";

export type ContextoTrazabilidad = {
  contratoId?: string;
  inmuebleId?: string;
  pagoId?: string;
  usuarioAfectadoId?: string;
};

export async function inferirContextoTrazabilidad(
  entidadTipo: EntidadTipoTrazabilidad,
  entidadId: string,
  partial?: Partial<ContextoTrazabilidad>
): Promise<ContextoTrazabilidad> {
  const ctx: ContextoTrazabilidad = { ...partial };
  if (partial?.pagoId) ctx.pagoId = partial.pagoId;
  if (partial?.contratoId) ctx.contratoId = partial.contratoId;
  if (partial?.inmuebleId) ctx.inmuebleId = partial.inmuebleId;

  switch (entidadTipo) {
    case "CONTRATO": {
      ctx.contratoId = entidadId;
      const c = await getContratosRepository().findById(entidadId);
      if (c) {
        ctx.inmuebleId = c.inmuebleId;
        if (c.arrendatarioId) ctx.usuarioAfectadoId = c.arrendatarioId;
      }
      break;
    }
    case "INMUEBLE": {
      ctx.inmuebleId = entidadId;
      const contratos = await getContratosRepository().findAll();
      const activo = contratos.find(
        (c) =>
          c.inmuebleId === entidadId &&
          (c.estado === "CONFIRMADO" || c.estado === "PENDIENTE_CONFIRMACION")
      );
      if (activo) ctx.contratoId = activo.id;
      break;
    }
    case "PAGO": {
      ctx.pagoId = entidadId;
      const pago = await getPagosRepository().findById(entidadId);
      if (pago) {
        ctx.contratoId = pago.contratoId;
        const c = await getContratosRepository().findById(pago.contratoId);
        if (c) ctx.inmuebleId = c.inmuebleId;
      }
      break;
    }
    case "SERVICIO_PUBLICO": {
      const srv = await getServiciosContratoRepository().findById(entidadId);
      if (srv) {
        ctx.contratoId = srv.contratoId;
        ctx.inmuebleId = srv.inmuebleId;
      }
      break;
    }
    case "PAGO_SERVICIO_PUBLICO": {
      const p = await getPagosServicioRepository().findById(entidadId);
      if (p) {
        ctx.contratoId = p.contratoId;
        ctx.inmuebleId = p.inmuebleId;
      }
      break;
    }
    case "MANTENIMIENTO": {
      const m = await getMantenimientoRepository().findById(entidadId);
      if (m) {
        ctx.inmuebleId = m.inmuebleId;
        ctx.usuarioAfectadoId = m.solicitadoPorId;
        const contratos = await getContratosRepository().findAll();
        const activo = contratos.find(
          (c) =>
            c.inmuebleId === m.inmuebleId &&
            (c.estado === "CONFIRMADO" || c.estado === "PENDIENTE_CONFIRMACION")
        );
        if (activo) ctx.contratoId = activo.id;
      }
      break;
    }
    case "NO_RENOVACION": {
      const nr = await getNoRenovacionRepository().findById(entidadId);
      if (nr) {
        ctx.contratoId = nr.contratoId;
        const c = await getContratosRepository().findById(nr.contratoId);
        if (c) ctx.inmuebleId = c.inmuebleId;
      }
      break;
    }
    case "INVITACION_CONTRATO": {
      const { getInvitacionesContratoRepository } = await import("@/repositories");
      const inv = await getInvitacionesContratoRepository().findById(entidadId);
      if (inv) {
        ctx.contratoId = inv.contratoId;
        const c = await getContratosRepository().findById(inv.contratoId);
        if (c) ctx.inmuebleId = c.inmuebleId;
      }
      break;
    }
    case "SOPORTE_PAGO": {
      const { getSoportePagoRepository } = await import("@/repositories");
      const sp = await getSoportePagoRepository().findById(entidadId);
      if (sp) {
        ctx.contratoId = sp.contratoId;
        ctx.pagoId = sp.pagoId;
        ctx.usuarioAfectadoId = sp.arrendatarioId;
        const c = await getContratosRepository().findById(sp.contratoId);
        if (c) ctx.inmuebleId = c.inmuebleId;
      }
      break;
    }
    case "NOTIFICACION":
    case "USUARIO":
      break;
  }

  if (!ctx.inmuebleId && ctx.contratoId) {
    const c = await getContratosRepository().findById(ctx.contratoId);
    if (c) ctx.inmuebleId = c.inmuebleId;
  }

  return ctx;
}

export async function contextoDesdeContrato(
  contratoId: string
): Promise<ContextoTrazabilidad> {
  const c = await getContratosRepository().findById(contratoId);
  return {
    contratoId,
    inmuebleId: c?.inmuebleId,
    usuarioAfectadoId: c?.arrendatarioId || undefined,
  };
}

export async function contextoDesdeInmueble(
  inmuebleId: string
): Promise<ContextoTrazabilidad> {
  return inferirContextoTrazabilidad("INMUEBLE", inmuebleId, { inmuebleId });
}

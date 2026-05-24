/**
 * Filtros por rol — delegados en access-control.service.
 * Al conectar Supabase/PostgreSQL, reforzar con RLS en backend.
 */

import {
  buildAccessContext,
  filterContratosByUser,
  filterInmueblesByUser,
  filterMantenimiento as filterMantenimientoCtx,
  filterNoRenovacion as filterNoRenovacionCtx,
  filterPagos as filterPagosCtx,
  filterPagosServicio as filterPagosServicioCtx,
  type AccessContext,
} from "@/services/access-control.service";
import type {
  Contrato,
  Inmueble,
  Mantenimiento,
  NoRenovacion,
  PagoReportado,
  PagoServicioPublico,
  Usuario,
} from "@/types";

function ctxFrom(
  user: Usuario,
  contratos: Contrato[],
  inmuebles: Inmueble[],
  invitaciones: { emailInvitado: string; estado: string }[] = []
): AccessContext {
  return buildAccessContext(user, {
    contratos,
    inmuebles,
    invitaciones: invitaciones as AccessContext["invitaciones"],
  });
}

export function filterInmuebles(
  items: Inmueble[],
  user: Usuario,
  contratosAccesibles?: Contrato[]
): Inmueble[] {
  return filterInmueblesByUser(items, user, contratosAccesibles);
}

export function inmueblesParaMantenimiento(
  inmuebles: Inmueble[],
  contratos: Contrato[],
  user: Usuario
): Inmueble[] {
  const contratosAcc = filterContratosByUser(contratos, user);
  return filterInmueblesByUser(inmuebles, user, contratosAcc);
}

export function filterContratos(items: Contrato[], user: Usuario): Contrato[] {
  return filterContratosByUser(items, user);
}

export function contratoIdsForUser(user: Usuario, contratos: Contrato[]): Set<string> {
  return new Set(filterContratosByUser(contratos, user).map((c) => c.id));
}

export function inmuebleIdsForUser(
  user: Usuario,
  inmuebles: Inmueble[],
  contratos: Contrato[] = []
): Set<string> {
  const contratosAcc = filterContratosByUser(contratos, user);
  return new Set(filterInmueblesByUser(inmuebles, user, contratosAcc).map((i) => i.id));
}

export function filterPagos(
  items: PagoReportado[],
  user: Usuario,
  contratos: Contrato[]
): PagoReportado[] {
  return filterPagosCtx(ctxFrom(user, contratos, []), items);
}

export function filterPagosServicio(
  items: PagoServicioPublico[],
  user: Usuario,
  contratos: Contrato[]
): PagoServicioPublico[] {
  return filterPagosServicioCtx(ctxFrom(user, contratos, []), items);
}

export function filterMantenimiento(
  items: Mantenimiento[],
  user: Usuario,
  inmuebles: Inmueble[],
  contratos: Contrato[] = []
): Mantenimiento[] {
  return filterMantenimientoCtx(ctxFrom(user, contratos, inmuebles), items);
}

export function filterNoRenovacion(
  items: NoRenovacion[],
  user: Usuario,
  contratos: Contrato[]
): NoRenovacion[] {
  return filterNoRenovacionCtx(ctxFrom(user, contratos, []), items);
}

export function canAccessContrato(contrato: Contrato, user: Usuario): boolean {
  return filterContratosByUser([contrato], user).length > 0;
}

export function canAccessInmueble(
  inmueble: Inmueble,
  user: Usuario,
  contratos: Contrato[] = []
): boolean {
  return filterInmueblesByUser([inmueble], user, contratos).length > 0;
}

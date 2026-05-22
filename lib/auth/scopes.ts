import type {
  Contrato,
  Inmueble,
  Mantenimiento,
  NoRenovacion,
  PagoReportado,
  ServicioPublico,
  Usuario,
} from "@/types";

export function filterInmuebles(items: Inmueble[], user: Usuario): Inmueble[] {
  if (user.rol === "ADMIN") return items;
  if (user.rol === "ARRENDADOR") {
    return items.filter((i) => i.arrendadorId === user.id);
  }
  return [];
}

export function filterContratos(items: Contrato[], user: Usuario): Contrato[] {
  if (user.rol === "ADMIN") return items;
  if (user.rol === "ARRENDADOR") {
    return items.filter((c) => c.arrendadorId === user.id);
  }
  if (user.rol === "ARRENDATARIO") {
    return items.filter((c) => c.arrendatarioId === user.id);
  }
  return [];
}

export function contratoIdsForUser(
  user: Usuario,
  contratos: Contrato[]
): Set<string> {
  return new Set(filterContratos(contratos, user).map((c) => c.id));
}

export function inmuebleIdsForUser(
  user: Usuario,
  inmuebles: Inmueble[]
): Set<string> {
  return new Set(filterInmuebles(inmuebles, user).map((i) => i.id));
}

export function filterPagos(
  items: PagoReportado[],
  user: Usuario,
  contratos: Contrato[]
): PagoReportado[] {
  if (user.rol === "ADMIN") return items;
  const ids = contratoIdsForUser(user, contratos);
  return items.filter((p) => ids.has(p.contratoId));
}

export function filterServicios(
  items: ServicioPublico[],
  user: Usuario,
  inmuebles: Inmueble[]
): ServicioPublico[] {
  if (user.rol === "ADMIN") return items;
  const ids = inmuebleIdsForUser(user, inmuebles);
  return items.filter((s) => ids.has(s.inmuebleId));
}

export function filterMantenimiento(
  items: Mantenimiento[],
  user: Usuario,
  inmuebles: Inmueble[]
): Mantenimiento[] {
  if (user.rol === "ADMIN") return items;
  if (user.rol === "ARRENDATARIO") {
    return items.filter((m) => m.solicitadoPorId === user.id);
  }
  const ids = inmuebleIdsForUser(user, inmuebles);
  return items.filter((m) => ids.has(m.inmuebleId));
}

export function filterNoRenovacion(
  items: NoRenovacion[],
  user: Usuario,
  contratos: Contrato[]
): NoRenovacion[] {
  if (user.rol === "ADMIN") return items;
  const ids = contratoIdsForUser(user, contratos);
  return items.filter((n) => ids.has(n.contratoId));
}

export function canAccessContrato(contrato: Contrato, user: Usuario): boolean {
  return filterContratos([contrato], user).length > 0;
}

export function canAccessInmueble(inmueble: Inmueble, user: Usuario): boolean {
  return filterInmuebles([inmueble], user).length > 0;
}

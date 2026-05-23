import { rolEfectivo } from "@/lib/auth/rol";
import type {
  Contrato,
  Inmueble,
  Mantenimiento,
  NoRenovacion,
  PagoReportado,
  PagoServicioPublico,
  Usuario,
} from "@/types";

export function filterInmuebles(items: Inmueble[], user: Usuario): Inmueble[] {
  const rol = rolEfectivo(user);
  if (rol === "ADMIN") return items;
  if (rol === "ARRENDADOR") {
    return items.filter((i) => i.arrendadorId === user.id);
  }
  return [];
}

/** Inmuebles donde el usuario puede abrir una solicitud de mantenimiento. */
export function inmueblesParaMantenimiento(
  inmuebles: Inmueble[],
  contratos: Contrato[],
  user: Usuario
): Inmueble[] {
  const rol = rolEfectivo(user);
  if (rol === "ADMIN") return inmuebles;
  if (rol === "ARRENDATARIO") {
    const ids = new Set(
      filterContratos(contratos, user)
        .filter((c) => c.estado === "CONFIRMADO")
        .map((c) => c.inmuebleId)
    );
    return inmuebles.filter((i) => ids.has(i.id));
  }
  return filterInmuebles(inmuebles, user);
}

export function filterContratos(items: Contrato[], user: Usuario): Contrato[] {
  const rol = rolEfectivo(user);
  if (rol === "ADMIN") return items;
  if (rol === "ARRENDADOR") {
    return items.filter((c) => c.arrendadorId === user.id);
  }
  if (rol === "ARRENDATARIO") {
    const email = user.email.toLowerCase();
    return items.filter(
      (c) =>
        c.arrendatarioId === user.id ||
        c.emailArrendatario?.toLowerCase() === email
    );
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
  if (rolEfectivo(user) === "ADMIN") return items;
  const ids = contratoIdsForUser(user, contratos);
  return items.filter((p) => ids.has(p.contratoId));
}

export function filterPagosServicio(
  items: PagoServicioPublico[],
  user: Usuario,
  contratos: Contrato[]
): PagoServicioPublico[] {
  if (rolEfectivo(user) === "ADMIN") return items;
  const ids = contratoIdsForUser(user, contratos);
  return items.filter((p) => ids.has(p.contratoId));
}

export function filterMantenimiento(
  items: Mantenimiento[],
  user: Usuario,
  inmuebles: Inmueble[],
  contratos: Contrato[] = []
): Mantenimiento[] {
  const rol = rolEfectivo(user);
  if (rol === "ADMIN") return items;
  if (rol === "ARRENDATARIO") {
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
  if (rolEfectivo(user) === "ADMIN") return items;
  const ids = contratoIdsForUser(user, contratos);
  return items.filter((n) => ids.has(n.contratoId));
}

export function canAccessContrato(contrato: Contrato, user: Usuario): boolean {
  return filterContratos([contrato], user).length > 0;
}

export function canAccessInmueble(inmueble: Inmueble, user: Usuario): boolean {
  return filterInmuebles([inmueble], user).length > 0;
}

import type { EstadoMantenimiento, Rol } from "@/types";

export const ESTADOS_MANTENIMIENTO: EstadoMantenimiento[] = [
  "ABIERTO",
  "EN_GESTION",
  "RESUELTO",
  "CERRADO",
  "RECHAZADO",
];

/** Campos de la solicitud original del arrendatario. */
export const CAMPOS_SOLICITUD_MANTENIMIENTO = [
  "titulo",
  "descripcion",
  "prioridad",
  "adjuntoUrl",
] as const;

export function arrendatarioPuedeEditarSolicitud(estado: EstadoMantenimiento): boolean {
  return estado === "ABIERTO";
}

export function puedeAgregarComentario(
  rol: Rol,
  estado: EstadoMantenimiento
): boolean {
  if (estado === "CERRADO") return rol === "ADMIN";
  if (rol === "ADMIN" || rol === "ARRENDADOR" || rol === "ARRENDATARIO") return true;
  return false;
}

export function arrendadorPuedeGestionarEstado(rol: Rol): boolean {
  return rol === "ARRENDADOR" || rol === "ADMIN";
}

export const MENSAJE_EDICION_BLOQUEADA =
  "El ticket ya se encuentra en gestión. Puedes agregar un comentario, pero no modificar la solicitud original.";

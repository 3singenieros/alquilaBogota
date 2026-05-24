import type { Contrato, Inmueble, Usuario } from "@/types";
import { formatInmuebleUbicacion } from "@/lib/inmueble-ubicacion";

export function inmuebleOptionLabel(inmueble: Inmueble): string {
  const ubicacion = inmueble.localidad
    ? ` — ${formatInmuebleUbicacion(inmueble)}`
    : "";
  return `${inmueble.code} — ${inmueble.titulo}${ubicacion}`;
}

export function inmueblesById(inmuebles: Inmueble[]): Map<string, Inmueble> {
  return new Map(inmuebles.map((i) => [i.id, i]));
}

export function contratoOptionLabel(
  contrato: Contrato,
  inmueblesMap: Map<string, Inmueble>
): string {
  const inmueble = inmueblesMap.get(contrato.inmuebleId);
  if (!inmueble) return contrato.code;
  return `${contrato.code} — ${inmuebleOptionLabel(inmueble)}`;
}

export function inmuebleDisplayFromId(
  inmuebleId: string,
  inmueblesMap: Map<string, Inmueble>
): string {
  const inmueble = inmueblesMap.get(inmuebleId);
  return inmueble ? inmuebleOptionLabel(inmueble) : inmuebleId;
}

export function usuariosById(usuarios: Usuario[]): Map<string, Usuario> {
  return new Map(usuarios.map((u) => [u.id, u]));
}

export function usuarioDisplayFromId(
  usuarioId: string,
  usuariosMap: Map<string, Usuario>
): string {
  const u = usuariosMap.get(usuarioId);
  return u ? `${u.nombre} (${u.email})` : usuarioId;
}

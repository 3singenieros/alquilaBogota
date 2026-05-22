import type { Contrato, Inmueble } from "@/types";

export function inmuebleOptionLabel(inmueble: Inmueble): string {
  return `${inmueble.code} — ${inmueble.titulo}`;
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

import type { Inmueble } from "@/types";

/**
 * El modelo conserva el campo `ciudad` para permitir futura expansión multi-ciudad,
 * aunque el alcance actual del prototipo se limita a Bogotá D.C.
 */
export const CIUDAD_PROTOTIPO = "Bogotá D.C." as const;

export const LOCALIDADES_BOGOTA = [
  "Usaquén",
  "Chapinero",
  "Santa Fe",
  "San Cristóbal",
  "Usme",
  "Tunjuelito",
  "Bosa",
  "Kennedy",
  "Fontibón",
  "Engativá",
  "Suba",
  "Barrios Unidos",
  "Teusaquillo",
  "Los Mártires",
  "Antonio Nariño",
  "Puente Aranda",
  "La Candelaria",
  "Rafael Uribe Uribe",
  "Ciudad Bolívar",
  "Sumapaz",
] as const;

export type LocalidadBogota = (typeof LOCALIDADES_BOGOTA)[number];

export const ESTRATOS_INMUEBLE = [1, 2, 3, 4, 5, 6] as const;

export function normalizeCiudadPrototipo(_ciudad?: string): string {
  return CIUDAD_PROTOTIPO;
}

/** Ej.: "Suba, Bogotá D.C." */
export function formatInmuebleUbicacion(
  inmueble: Pick<Inmueble, "localidad" | "ciudad" | "barrio">
): string {
  if (inmueble.localidad) {
    return `${inmueble.localidad}, ${inmueble.ciudad || CIUDAD_PROTOTIPO}`;
  }
  return inmueble.ciudad || CIUDAD_PROTOTIPO;
}

/** Ej.: "Calle 45 #12-30, Chapinero, Bogotá D.C." */
export function formatInmuebleDireccionCompleta(
  inmueble: Pick<Inmueble, "direccion" | "localidad" | "ciudad" | "barrio">
): string {
  const segmentos = [inmueble.direccion];
  if (inmueble.barrio) segmentos.push(inmueble.barrio);
  segmentos.push(formatInmuebleUbicacion(inmueble));
  return segmentos.join(", ");
}

export function isLocalidadBogota(value: string): value is LocalidadBogota {
  return (LOCALIDADES_BOGOTA as readonly string[]).includes(value);
}

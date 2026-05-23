import type { PeriodicidadServicio, TipoServicioPublico } from "@/types";

export const TIPOS_SERVICIO: TipoServicioPublico[] = [
  "ENERGIA",
  "AGUA",
  "GAS",
  "INTERNET",
  "ADMINISTRACION",
  "OTRO",
];

export const TIPO_SERVICIO_LABEL: Record<TipoServicioPublico, string> = {
  ENERGIA: "Energía",
  AGUA: "Agua",
  GAS: "Gas",
  INTERNET: "Internet",
  ADMINISTRACION: "Administración",
  OTRO: "Otro",
};

export const PERIODICIDAD_LABEL: Record<PeriodicidadServicio, string> = {
  MENSUAL: "Mensual",
  BIMESTRAL: "Bimestral",
};

export function labelServicioContrato(
  tipo: TipoServicioPublico,
  empresa: string
): string {
  return `${TIPO_SERVICIO_LABEL[tipo]} — ${empresa}`;
}

export function descripcionPagoServicio(
  tipo: TipoServicioPublico,
  empresa: string,
  periodo: string
): string {
  return `${TIPO_SERVICIO_LABEL[tipo]} (${empresa}), periodo ${periodo}`;
}

import type { Contrato, EstadoContrato } from "@/types";

/** Contrato vigente que ocupa el inmueble (arrendamiento activo). */
export const ESTADOS_CONTRATO_VIGENTE: EstadoContrato[] = ["CONFIRMADO"];

export function contratoEsVigente(contrato: Contrato): boolean {
  return ESTADOS_CONTRATO_VIGENTE.includes(contrato.estado);
}

export function contratoPendienteConfirmacion(contrato: Contrato): boolean {
  return contrato.estado === "PENDIENTE_CONFIRMACION";
}

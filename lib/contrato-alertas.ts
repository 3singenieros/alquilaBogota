import { contratoEsVigente } from "@/lib/contrato-estados";
import type { Contrato } from "@/types";

export const DIAS_CONTRATO_PROXIMO_VENCER = 90;

export function diasHasta(fechaIso: string, hoy = new Date()): number {
  const fin = new Date(fechaIso + "T12:00:00");
  const base = new Date(hoy.toISOString().slice(0, 10) + "T12:00:00");
  return Math.ceil((fin.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));
}

export function contratoProximoAVencer(
  contrato: Contrato,
  hoy = new Date()
): boolean {
  if (!contratoEsVigente(contrato)) return false;
  const dias = diasHasta(contrato.fechaFin, hoy);
  return dias >= 0 && dias <= DIAS_CONTRATO_PROXIMO_VENCER;
}

export function preavisoVencido(contrato: Contrato, hoy = new Date()): boolean {
  if (!contrato.prorrogaAutomatica || !contratoEsVigente(contrato)) return false;
  if (!contrato.fechaLimitePreaviso) return false;
  const limite = new Date(contrato.fechaLimitePreaviso + "T23:59:59");
  return hoy > limite;
}

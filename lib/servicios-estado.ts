import type { EstadoPagoServicioPublico, PagoServicioPublico } from "@/types";

export function fechaHoy(): string {
  return new Date().toISOString().slice(0, 10);
}

export function pagoVencidoPorFecha(
  fechaVencimiento: string,
  ref = fechaHoy()
): boolean {
  return fechaVencimiento < ref;
}

export function debeMarcarPagoVencido(
  p: PagoServicioPublico,
  ref = fechaHoy()
): boolean {
  if (p.estado === "VALIDADO" || p.estado === "RECHAZADO") return false;
  return pagoVencidoPorFecha(p.fechaVencimiento, ref);
}

export function puedeReportarNuevoPago(estado?: EstadoPagoServicioPublico): boolean {
  return !estado;
}

export function puedeValidarORechazarPago(estado: EstadoPagoServicioPublico): boolean {
  return estado === "REPORTADO" || estado === "VENCIDO";
}

/** Fin de mes del periodo YYYY-MM para vencimiento por defecto. */
export function finMesPeriodo(periodo: string): string {
  const m = periodo.match(/^(\d{4})-(\d{2})$/);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]);
    const last = new Date(year, month, 0);
    return last.toISOString().slice(0, 10);
  }
  const bim = periodo.match(/^(\d{4})-(\d{2})-(\d{4})-(\d{2})$/);
  if (bim) {
    const year = Number(bim[3]);
    const month = Number(bim[4]);
    const last = new Date(year, month, 0);
    return last.toISOString().slice(0, 10);
  }
  return fechaHoy();
}

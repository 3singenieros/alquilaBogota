import type { FiltrosReporte } from "@/types/reportes";
import type { EventoTrazabilidad } from "@/types/trazabilidad";

const ACCIONES_ECONOMICAS = new Set([
  "PAGO_REPORTADO",
  "PAGO_VALIDADO",
  "PAGO_RECHAZADO",
  "PAGO_SERVICIO_REPORTADO",
  "PAGO_SERVICIO_VALIDADO",
  "PAGO_SERVICIO_RECHAZADO",
  "REAJUSTE_CANON_APLICADO",
  "CANON_MODIFICADO",
  "MANTENIMIENTO_VALOR_ESTIMADO_REGISTRADO",
  "MANTENIMIENTO_VALOR_FINAL_REGISTRADO",
]);

export function aplicarFiltrosEventos(
  eventos: EventoTrazabilidad[],
  filtros: Partial<FiltrosReporte>
): EventoTrazabilidad[] {
  let out = [...eventos];

  if (filtros.fechaDesde) {
    out = out.filter((e) => e.fechaHora >= filtros.fechaDesde!);
  }
  if (filtros.fechaHasta) {
    const fin = filtros.fechaHasta.includes("T")
      ? filtros.fechaHasta
      : `${filtros.fechaHasta}T23:59:59.999Z`;
    out = out.filter((e) => e.fechaHora <= fin);
  }
  if (filtros.accionTrazabilidad) {
    out = out.filter((e) => e.accion === filtros.accionTrazabilidad);
  }
  if (filtros.usuarioRol) {
    out = out.filter((e) => e.usuarioRol === filtros.usuarioRol);
  }
  if (filtros.soloCambiosEstado) {
    out = out.filter((e) => e.estadoAnterior && e.estadoNuevo);
  }
  if (filtros.soloConAdjuntos) {
    out = out.filter(
      (e) =>
        e.accion === "DOCUMENTO_ADJUNTADO" ||
        Boolean(e.metadata?.adjuntos) ||
        Boolean(e.metadata?.archivos)
    );
  }
  if (filtros.soloEventosEconomicos) {
    out = out.filter((e) => ACCIONES_ECONOMICAS.has(e.accion));
  }
  if (filtros.textoLibre?.trim()) {
    const q = filtros.textoLibre.toLowerCase();
    out = out.filter(
      (e) =>
        e.descripcion.toLowerCase().includes(q) ||
        e.usuarioNombre.toLowerCase().includes(q) ||
        e.entidadId.toLowerCase().includes(q) ||
        e.accion.toLowerCase().includes(q)
    );
  }

  return out.sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));
}

export function filtrosAplicadosLabels(
  filtros: Partial<FiltrosReporte>
): Record<string, string> {
  const labels: Record<string, string> = {};
  const map: [keyof FiltrosReporte, string][] = [
    ["contratoId", "Contrato"],
    ["inmuebleId", "Inmueble"],
    ["fechaDesde", "Desde"],
    ["fechaHasta", "Hasta"],
    ["accionTrazabilidad", "Acción"],
    ["usuarioRol", "Rol"],
    ["estadoPago", "Estado pago"],
    ["estadoContrato", "Estado contrato"],
    ["textoLibre", "Búsqueda"],
    ["noRenovacionId", "No renovación"],
  ];
  for (const [key, label] of map) {
    const v = filtros[key];
    if (v !== undefined && v !== "") labels[label] = String(v);
  }
  if (filtros.soloConAdjuntos) labels["Filtro"] = "Solo con adjuntos";
  if (filtros.soloCambiosEstado) labels["Filtro"] = "Solo cambios de estado";
  if (filtros.soloEventosEconomicos) labels["Filtro"] = "Solo eventos económicos";
  return labels;
}

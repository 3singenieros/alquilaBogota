import type { ArchivoAdjunto } from "@/types";
import type { AccionTrazabilidad, EventoTrazabilidad } from "@/types/trazabilidad";

export type TipoReporte =
  | "HISTORIAL_CONTRATO"
  | "HISTORIAL_INMUEBLE"
  | "ESTADO_CUENTA"
  | "PAGOS_CANON"
  | "SERVICIOS_PUBLICOS"
  | "MANTENIMIENTO"
  | "NO_RENOVACION"
  | "TRAZABILIDAD_GLOBAL"
  | "CONTRATOS_VENCER"
  | "CARTERA_BASICA";

export type FiltrosReporte = {
  tipoReporte: TipoReporte;
  contratoId?: string;
  inmuebleId?: string;
  arrendadorId?: string;
  arrendatarioId?: string;
  estadoContrato?: string;
  estadoPago?: string;
  estadoMantenimiento?: string;
  estadoServicio?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  accionTrazabilidad?: AccionTrazabilidad;
  usuarioRol?: string;
  soloConAdjuntos?: boolean;
  soloCambiosEstado?: boolean;
  soloEventosEconomicos?: boolean;
  textoLibre?: string;
  noRenovacionId?: string;
  mantenimientoId?: string;
};

export type ReporteFila = { etiqueta: string; valor: string };

export type ReporteSeccion = {
  id: string;
  titulo: string;
  descripcion?: string;
  filas?: ReporteFila[];
  tabla?: { columnas: string[]; filas: string[][] };
  texto?: string;
};

export type FirmaReporte = {
  rol: "ARRENDADOR" | "ARRENDATARIO" | "GENERADOR";
  nombre: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
};

export type ReporteDocumento = {
  tipo: TipoReporte;
  titulo: string;
  subtitulo?: string;
  fechaGeneracion: string;
  generadoPor: { nombre: string; email: string; rol: string };
  filtrosAplicados: Record<string, string>;
  resumen: ReporteFila[];
  secciones: ReporteSeccion[];
  eventosTrazabilidad: EventoTrazabilidad[];
  adjuntosRelacionados: ArchivoAdjunto[];
  firmasRequeridas: FirmaReporte[];
};

export const REPORTE_CATALOGO: {
  tipo: TipoReporte;
  titulo: string;
  descripcion: string;
  requiereContrato?: boolean;
  requiereInmueble?: boolean;
}[] = [
  {
    tipo: "HISTORIAL_CONTRATO",
    titulo: "Historial completo del contrato",
    descripcion: "Línea de tiempo, documentos, pagos, servicios y no renovación",
    requiereContrato: true,
  },
  {
    tipo: "HISTORIAL_INMUEBLE",
    titulo: "Historial del inmueble",
    descripcion: "Contratos, mantenimientos y eventos del inmueble",
    requiereInmueble: true,
  },
  {
    tipo: "ESTADO_CUENTA",
    titulo: "Estado de cuenta del contrato",
    descripcion: "Canon, pagos y servicios pendientes o validados",
    requiereContrato: true,
  },
  {
    tipo: "PAGOS_CANON",
    titulo: "Reporte de pagos del canon",
    descripcion: "Pagos reportados con comprobantes y trazabilidad",
    requiereContrato: true,
  },
  {
    tipo: "SERVICIOS_PUBLICOS",
    titulo: "Servicios públicos",
    descripcion: "Servicios configurados y pagos por periodo",
    requiereContrato: true,
  },
  {
    tipo: "MANTENIMIENTO",
    titulo: "Reporte de mantenimiento",
    descripcion: "Tickets, responsabilidad y evidencias",
    requiereInmueble: true,
  },
  {
    tipo: "NO_RENOVACION",
    titulo: "Reporte de no renovación",
    descripcion: "Comunicación formal, envío y evidencias",
    requiereContrato: true,
  },
  {
    tipo: "TRAZABILIDAD_GLOBAL",
    titulo: "Trazabilidad global",
    descripcion: "Eventos filtrados del sistema",
  },
  {
    tipo: "CONTRATOS_VENCER",
    titulo: "Contratos próximos a vencer",
    descripcion: "Preaviso y estado de no renovación",
  },
  {
    tipo: "CARTERA_BASICA",
    titulo: "Cartera básica / pendientes",
    descripcion: "Pagos y servicios por validar o vencidos",
  },
];

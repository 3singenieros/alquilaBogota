import type { Usuario } from "@/types";
import type {
  FirmaReporte,
  FiltrosReporte,
  ReporteDocumento,
  ReporteFila,
  ReporteSeccion,
  TipoReporte,
} from "@/types/reportes";
import type { EventoTrazabilidad } from "@/types/trazabilidad";
import { filtrosAplicadosLabels } from "@/lib/reportes/filtros-eventos";
import type { ArchivoAdjunto, Contrato } from "@/types";

export const APP_NOMBRE = "AlquilaBogotá — Gestión de arrendamientos";

export function crearBaseReporte(input: {
  tipo: TipoReporte;
  titulo: string;
  subtitulo?: string;
  usuario: Usuario;
  filtros: Partial<FiltrosReporte>;
  resumen?: ReporteFila[];
  secciones?: ReporteSeccion[];
  eventos?: EventoTrazabilidad[];
  adjuntos?: ArchivoAdjunto[];
  firmas?: FirmaReporte[];
}): ReporteDocumento {
  return {
    tipo: input.tipo,
    titulo: input.titulo,
    subtitulo: input.subtitulo,
    fechaGeneracion: new Date().toISOString(),
    generadoPor: {
      nombre: input.usuario.nombre,
      email: input.usuario.email,
      rol: input.usuario.rol,
    },
    filtrosAplicados: filtrosAplicadosLabels(input.filtros),
    resumen: input.resumen ?? [],
    secciones: input.secciones ?? [],
    eventosTrazabilidad: input.eventos ?? [],
    adjuntosRelacionados: input.adjuntos ?? [],
    firmasRequeridas: input.firmas ?? [],
  };
}

export function firmasDesdeContrato(
  contrato: Contrato,
  generador?: Usuario
): FirmaReporte[] {
  const firmas: FirmaReporte[] = [];
  if (contrato.nombreArrendador) {
    firmas.push({
      rol: "ARRENDADOR",
      nombre: contrato.nombreArrendador,
      tipoDocumento: contrato.tipoDocumentoArrendador,
      numeroDocumento: contrato.numeroDocumentoArrendador,
    });
  }
  if (contrato.nombreArrendatario) {
    firmas.push({
      rol: "ARRENDATARIO",
      nombre: contrato.nombreArrendatario,
      tipoDocumento: contrato.tipoDocumentoArrendatario,
      numeroDocumento: contrato.numeroDocumentoArrendatario,
    });
  }
  if (generador) {
    firmas.push({
      rol: "GENERADOR",
      nombre: generador.nombre,
    });
  }
  return firmas;
}

import { AuthError } from "@/lib/auth/errors";
import type {
  AceptacionResponsabilidadMantenimiento,
  Mantenimiento,
  TipoResponsabilidadMantenimiento,
} from "@/types";

export function calcularMontosCompartidos(
  valorEstimado: number,
  porcentajeArrendador: number,
  porcentajeArrendatario: number
): { valorArrendador: number; valorArrendatario: number } {
  const valorArrendador = Math.round((valorEstimado * porcentajeArrendador) / 100);
  const valorArrendatario = Math.round(
    (valorEstimado * porcentajeArrendatario) / 100
  );
  return { valorArrendador, valorArrendatario };
}

export function validarPorcentajesCompartidos(
  porcentajeArrendador?: number,
  porcentajeArrendatario?: number
) {
  if (
    porcentajeArrendador === undefined ||
    porcentajeArrendatario === undefined
  ) {
    throw new AuthError(
      "Debes indicar el porcentaje del arrendador y del arrendatario",
      "FORBIDDEN"
    );
  }
  if (porcentajeArrendador + porcentajeArrendatario !== 100) {
    throw new AuthError(
      "Los porcentajes compartidos deben sumar exactamente 100",
      "FORBIDDEN"
    );
  }
}

export function validarDefinicionResponsabilidad(input: {
  tipoResponsabilidad: TipoResponsabilidadMantenimiento;
  valorEstimado?: number;
  fechaEstimadaAtencion?: string;
  observacionesResponsabilidad?: string;
  porcentajeArrendador?: number;
  porcentajeArrendatario?: number;
}) {
  const { tipoResponsabilidad } = input;

  if (tipoResponsabilidad === "POR_DEFINIR") return;

  if (tipoResponsabilidad === "ARRENDATARIO") {
    return;
  }

  if (tipoResponsabilidad === "ARRENDADOR") {
    if (input.valorEstimado === undefined || input.valorEstimado <= 0) {
      throw new AuthError(
        "Indica el valor estimado de la reparación (responsabilidad del arrendador)",
        "FORBIDDEN"
      );
    }
    if (!input.fechaEstimadaAtencion?.trim()) {
      throw new AuthError(
        "Indica la fecha estimada de atención",
        "FORBIDDEN"
      );
    }
    if (!input.observacionesResponsabilidad?.trim()) {
      throw new AuthError(
        "Agrega observaciones sobre la responsabilidad económica",
        "FORBIDDEN"
      );
    }
    return;
  }

  if (tipoResponsabilidad === "COMPARTIDO") {
    if (input.valorEstimado === undefined || input.valorEstimado <= 0) {
      throw new AuthError("Indica el valor estimado total", "FORBIDDEN");
    }
    validarPorcentajesCompartidos(
      input.porcentajeArrendador,
      input.porcentajeArrendatario
    );
    if (!input.observacionesResponsabilidad?.trim()) {
      throw new AuthError(
        "Describe la distribución compartida en observaciones",
        "FORBIDDEN"
      );
    }
  }
}

export function validarCierreMantenimiento(
  m: Mantenimiento,
  input: {
    valorFinal?: number;
    fechaCierre?: string;
    observacionesCierre?: string;
    documentosCierreCount?: number;
  }
) {
  const tipo = m.tipoResponsabilidad ?? "POR_DEFINIR";

  if (!input.fechaCierre?.trim()) {
    throw new AuthError("La fecha de cierre es obligatoria", "FORBIDDEN");
  }

  if (tipo === "ARRENDATARIO") {
    return;
  }

  if (tipo === "POR_DEFINIR") {
    throw new AuthError(
      "Define la responsabilidad económica antes de cerrar el ticket",
      "FORBIDDEN"
    );
  }

  if (tipo === "COMPARTIDO" && m.aceptacionArrendatario !== "ACEPTADA") {
    throw new AuthError(
      "El arrendatario debe aceptar la distribución compartida antes del cierre",
      "FORBIDDEN"
    );
  }

  if (input.valorFinal === undefined || input.valorFinal <= 0) {
    throw new AuthError("Indica el valor final de la reparación", "FORBIDDEN");
  }

  if (!input.observacionesCierre?.trim()) {
    throw new AuthError("Las observaciones de cierre son obligatorias", "FORBIDDEN");
  }

  if (tipo === "ARRENDADOR" || tipo === "COMPARTIDO") {
    if (!input.documentosCierreCount || input.documentosCierreCount < 1) {
      throw new AuthError(
        "Adjunta al menos un documento de soporte al cerrar",
        "FORBIDDEN"
      );
    }
  }
}

export function aceptacionInicial(
  tipo: TipoResponsabilidadMantenimiento
): AceptacionResponsabilidadMantenimiento {
  if (tipo === "COMPARTIDO") return "PENDIENTE";
  if (tipo === "ARRENDATARIO") return "NO_APLICA";
  return "NO_APLICA";
}

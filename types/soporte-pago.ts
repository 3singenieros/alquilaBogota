export type EstadoEnvioEmailSoporte = "PENDIENTE" | "SIMULADO" | "ERROR";

import type { ArchivoAdjunto } from "@/types";

export interface SoportePago {
  id: string;
  pagoId: string;
  contratoId: string;
  arrendadorId: string;
  arrendatarioId: string;
  numeroSoporte: string;
  fechaGeneracion: string;
  monto: number;
  periodo: string;
  medioPago?: string;
  observaciones?: string;
  estadoEnvioEmail: EstadoEnvioEmailSoporte;
  documentosAdjuntos?: ArchivoAdjunto[];
}

export type SoportePdfData = {
  soporte: SoportePago;
  arrendadorNombre: string;
  arrendadorEmail: string;
  arrendatarioNombre: string;
  arrendatarioEmail: string;
  inmuebleTitulo: string;
  inmuebleDireccion: string;
  contratoCode: string;
  fechaReporte: string;
  fechaValidacion: string;
};

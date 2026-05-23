export type EstadoEnvioEmailSoporte = "PENDIENTE" | "SIMULADO" | "ERROR";

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

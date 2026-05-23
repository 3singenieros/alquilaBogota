import type { SoportePago } from "@/types/soporte-pago";

export const seedSoportesPago: SoportePago[] = [
  {
    id: "sp-1",
    pagoId: "pag-1",
    contratoId: "ctr-1",
    arrendadorId: "u-arrendador",
    arrendatarioId: "u-arrendatario",
    numeroSoporte: "SP-2026-0001",
    fechaGeneracion: "2026-04-05",
    monto: 1800000,
    periodo: "2026-04",
    medioPago: "Transferencia bancaria",
    observaciones: "Pago validado sin novedad.",
    estadoEnvioEmail: "SIMULADO",
  },
];

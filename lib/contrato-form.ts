import type { Contrato, CreateInput } from "@/types";

export function buildContratoCreateInput(
  data: CreateInput<Contrato>
): CreateInput<Contrato> {
  const canonActual = data.canonActual ?? 0;
  return {
    ...data,
    canonActual,
    canonAnterior: data.canonAnterior ?? 0,
    porcentajeReajuste: data.porcentajeReajuste ?? 0,
    inventarioEntrega: data.inventarioEntrega ?? "",
    depositoGarantiaValor: data.depositoGarantiaValor ?? 0,
    depositoGarantiaEstado: data.depositoGarantiaEstado ?? "PENDIENTE",
    prorrogaAutomatica: data.prorrogaAutomatica ?? false,
    fechaLimitePreaviso: data.fechaLimitePreaviso ?? data.fechaFin,
  };
}

export function calcularCanonReajustado(canonActual: number, porcentaje: number): number {
  return Math.round(canonActual * (1 + porcentaje / 100));
}

export function parseContratoFormData(fd: FormData) {
  const prorroga = fd.get("prorrogaAutomatica");
  return {
    inmuebleId: fd.get("inmuebleId") as string,
    emailArrendatario: (fd.get("emailArrendatario") as string)?.trim(),
    nombreArrendatario: (fd.get("nombreArrendatario") as string) || undefined,
    arrendatarioId: (fd.get("arrendatarioId") as string) || "",
    arrendadorId: fd.get("arrendadorId") as string,
    fechaInicio: fd.get("fechaInicio") as string,
    fechaFin: fd.get("fechaFin") as string,
    canonActual: Number(fd.get("canonActual")),
    canonAnterior: Number(fd.get("canonAnterior") || 0),
    porcentajeReajuste: Number(fd.get("porcentajeReajuste") || 0),
    fechaUltimoReajuste: (fd.get("fechaUltimoReajuste") as string) || undefined,
    estado: fd.get("estado") as Contrato["estado"],
    documentoUrl: (fd.get("documentoUrl") as string) || undefined,
    codeudorNombre: (fd.get("codeudorNombre") as string) || undefined,
    codeudorDocumento: (fd.get("codeudorDocumento") as string) || undefined,
    codeudorTelefono: (fd.get("codeudorTelefono") as string) || undefined,
    codeudorEmail: (fd.get("codeudorEmail") as string) || undefined,
    depositoGarantiaValor: Number(fd.get("depositoGarantiaValor") || 0),
    depositoGarantiaEstado: fd.get("depositoGarantiaEstado") as Contrato["depositoGarantiaEstado"],
    prorrogaAutomatica: prorroga === "on" || prorroga === "true",
    fechaLimitePreaviso: fd.get("fechaLimitePreaviso") as string,
    inventarioEntrega: (fd.get("inventarioEntrega") as string) || "",
    observacionesEntrega: (fd.get("observacionesEntrega") as string) || undefined,
  };
}

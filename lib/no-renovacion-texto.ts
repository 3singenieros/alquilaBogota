import { formatDate } from "@/lib/utils";

export type TextoNoRenovacionInput = {
  ciudad: string;
  fechaCarta: string;
  remitenteNombre: string;
  remitenteTipoDocumento: string;
  remitenteNumeroDocumento: string;
  remitenteEmail: string;
  remitenteDireccion?: string;
  destinatarioNombre: string;
  destinatarioTipoDocumento: string;
  destinatarioNumeroDocumento: string;
  destinatarioEmail: string;
  destinatarioDireccion?: string;
  codigoContrato: string;
  inmuebleDireccion: string;
  fechaInicio: string;
  fechaFin: string;
  fechaLimitePreaviso?: string;
  motivo?: string;
  observaciones?: string;
};

export function generarTextoNoRenovacion(input: TextoNoRenovacionInput): string {
  const parrafos = [
    `${input.ciudad}, ${formatDate(input.fechaCarta)}`,
    "",
    `Señor(a)`,
    `${input.destinatarioNombre}`,
    `${input.destinatarioTipoDocumento} ${input.destinatarioNumeroDocumento}`,
    `Correo de notificaciones: ${input.destinatarioEmail}`,
    input.destinatarioDireccion
      ? `Dirección de notificación: ${input.destinatarioDireccion}`
      : "",
    "",
    `Asunto: Comunicación de no renovación del contrato de arrendamiento ${input.codigoContrato}`,
    "",
    `Yo, ${input.remitenteNombre}, identificado(a) con ${input.remitenteTipoDocumento} No. ${input.remitenteNumeroDocumento}, en calidad de parte del contrato de arrendamiento celebrado respecto del inmueble ubicado en ${input.inmuebleDireccion}, me permito manifestar de manera expresa mi decisión de NO RENOVAR el referido contrato de arrendamiento.`,
    "",
    `Datos del contrato:`,
    `- Código / número de contrato: ${input.codigoContrato}`,
    `- Dirección del inmueble: ${input.inmuebleDireccion}`,
    `- Fecha de inicio: ${formatDate(input.fechaInicio)}`,
    `- Fecha de finalización pactada: ${formatDate(input.fechaFin)}`,
    input.fechaLimitePreaviso
      ? `- Fecha límite de preaviso de no renovación: ${formatDate(input.fechaLimitePreaviso)}`
      : "",
    "",
    `En consecuencia, el contrato se entenderá vigente hasta la fecha de finalización indicada, sin perjuicio de las obligaciones de entrega del inmueble y demás cargas pactadas en el contrato y en la ley.`,
    "",
    `Solicito la entrega del inmueble en la fecha correspondiente al término del contrato, en las condiciones acordadas.`,
  ];

  if (input.motivo?.trim()) {
    parrafos.push("", `Motivo de la decisión: ${input.motivo.trim()}`);
  }
  if (input.observaciones?.trim()) {
    parrafos.push("", `Observaciones adicionales: ${input.observaciones.trim()}`);
  }

  parrafos.push(
    "",
    `Correo del remitente para notificaciones: ${input.remitenteEmail}`,
    input.remitenteDireccion
      ? `Dirección del remitente: ${input.remitenteDireccion}`
      : "",
    "",
    `Atentamente,`,
    "",
    `${input.remitenteNombre}`,
    `${input.remitenteTipoDocumento} ${input.remitenteNumeroDocumento}`
  );

  return parrafos.filter((l) => l !== undefined).join("\n");
}

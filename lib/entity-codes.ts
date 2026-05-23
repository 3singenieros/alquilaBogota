import { newId } from "@/repositories/mock-store";

/** Prefijos de código de negocio (mismo criterio que los id mock históricos). */
export const ENTITY_CODE_PREFIX = {
  usuario: "u",
  inmueble: "inm",
  contrato: "ctr",
  pago: "pag",
  servicio: "srv",
  servicioContrato: "sc",
  pagoServicio: "psv",
  comentarioMantenimiento: "cm",
  mantenimiento: "mnt",
  noRenovacion: "nr",
  soportePago: "sp",
} as const;

export function generateUniqueCode(
  prefix: string,
  existingCodes: Iterable<string>
): string {
  const used = new Set(existingCodes);
  let code: string;
  do {
    code = newId(prefix);
  } while (used.has(code));
  return code;
}

import { contratoEsVigente } from "@/lib/contrato-estados";
import type { Contrato, EstadoContrato } from "@/types";

const ESTADOS_OCUPAN_INMUEBLE: EstadoContrato[] = [
  "CONFIRMADO",
  "PENDIENTE_CONFIRMACION",
];

export function inmuebleTieneContratoActivo(
  contratos: Contrato[],
  inmuebleId: string,
  excludeContratoId?: string
): boolean {
  return contratos.some(
    (c) =>
      c.inmuebleId === inmuebleId &&
      ESTADOS_OCUPAN_INMUEBLE.includes(c.estado) &&
      c.id !== excludeContratoId
  );
}

export { contratoEsVigente };

export function filterInmueblesSinContratoActivo<T extends { id: string }>(
  inmuebles: T[],
  contratos: Contrato[],
  excludeContratoId?: string
): T[] {
  return inmuebles.filter(
    (inm) => !inmuebleTieneContratoActivo(contratos, inm.id, excludeContratoId)
  );
}

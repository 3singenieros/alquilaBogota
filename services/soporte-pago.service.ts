import { AuthError } from "@/lib/auth/errors";
import { canAccessContrato, contratoIdsForUser } from "@/lib/auth/scopes";
import { loadAuthContext } from "@/lib/auth/load-context";
import {
  getContratosRepository,
  getInmueblesRepository,
  getPagosRepository,
  getSoportePagoRepository,
  getUsuariosRepository,
} from "@/repositories";
import { assertModuleAccess, requireSession } from "@/services/auth.service";
import type { SoportePdfData } from "@/types/soporte-pago";
import { formatCurrency } from "@/lib/utils";

export async function listarSoportesPago() {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "pagos");
  const { contratos } = await loadAuthContext();
  const ids = contratoIdsForUser(usuario, contratos);
  const items = await getSoportePagoRepository().findAll();
  if (usuario.rol === "ADMIN") return items;
  return items.filter((s) => ids.has(s.contratoId));
}

export async function obtenerSoportePorPagoId(pagoId: string) {
  return getSoportePagoRepository().findByPagoId(pagoId);
}

export async function obtenerDatosPdfSoporte(
  soporteId: string
): Promise<SoportePdfData | null> {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "pagos");

  const soporte = await getSoportePagoRepository().findById(soporteId);
  if (!soporte) return null;

  const pago = await getPagosRepository().findById(soporte.pagoId);
  const contrato = await getContratosRepository().findById(soporte.contratoId);
  if (!contrato || !canAccessContrato(contrato, usuario)) {
    throw new AuthError("No tienes acceso a este soporte", "FORBIDDEN");
  }

  const inmueble = await getInmueblesRepository().findById(contrato.inmuebleId);
  const usuarios = await getUsuariosRepository().findAll();
  const arrendador = usuarios.find((u) => u.id === soporte.arrendadorId);
  const arrendatario = usuarios.find((u) => u.id === soporte.arrendatarioId);

  return {
    soporte,
    arrendadorNombre: arrendador?.nombre ?? "Arrendador",
    arrendadorEmail: arrendador?.email ?? "",
    arrendatarioNombre:
      arrendatario?.nombre ?? contrato.nombreArrendatario ?? "Arrendatario",
    arrendatarioEmail: arrendatario?.email ?? contrato.emailArrendatario,
    inmuebleTitulo: inmueble?.titulo ?? contrato.inmuebleId,
    inmuebleDireccion: inmueble?.direccion ?? "",
    contratoCode: contrato.code,
    fechaReporte: pago?.fechaReporte ?? soporte.fechaGeneracion,
    fechaValidacion: pago?.fechaValidacion ?? soporte.fechaGeneracion,
  };
}

export function formatMontoPdf(monto: number): string {
  return formatCurrency(monto);
}

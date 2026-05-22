import { AuthError } from "@/lib/auth/errors";
import { loadAuthContext } from "@/lib/auth/load-context";
import { assertModuleAccess, requireSession } from "@/services/auth.service";
import {
  canAccessContrato,
  filterPagos,
} from "@/lib/auth/scopes";
import { getContratosRepository, getPagosRepository } from "@/repositories";
import type { CreateInput, PagoReportado, UpdateInput } from "@/types";

async function assertPagoAccess(contratoId: string) {
  const { usuario } = await requireSession();
  const contrato = await getContratosRepository().findById(contratoId);
  if (!contrato || !canAccessContrato(contrato, usuario)) {
    throw new AuthError("Contrato no permitido para este usuario", "FORBIDDEN");
  }
  return { usuario, contrato };
}

export async function listarPagos() {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "pagos");
  const { contratos } = await loadAuthContext();
  const items = await getPagosRepository().findAll();
  return filterPagos(items, usuario, contratos);
}

export async function crearPago(data: CreateInput<PagoReportado>) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "pagos");
  await assertPagoAccess(data.contratoId);

  if (usuario.rol === "ARRENDATARIO") {
    data = {
      ...data,
      reportadoPorId: usuario.id,
      estado: "REPORTADO",
    };
  }

  return getPagosRepository().create(data);
}

export async function actualizarPago(id: string, data: UpdateInput<PagoReportado>) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "pagos");

  const pago = await getPagosRepository().findById(id);
  if (!pago) {
    throw new AuthError("Pago no encontrado", "FORBIDDEN");
  }
  await assertPagoAccess(pago.contratoId);

  if (usuario.rol === "ARRENDATARIO") {
    throw new AuthError("El arrendatario no puede modificar pagos", "FORBIDDEN");
  }

  return getPagosRepository().update(id, data);
}

export async function eliminarPago(id: string) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "pagos");
  if (usuario.rol !== "ADMIN") {
    throw new AuthError("Solo administración puede eliminar pagos", "FORBIDDEN");
  }
  const pago = await getPagosRepository().findById(id);
  if (!pago) return false;
  await assertPagoAccess(pago.contratoId);
  return getPagosRepository().delete(id);
}

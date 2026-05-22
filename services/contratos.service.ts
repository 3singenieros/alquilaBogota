import { AuthError } from "@/lib/auth/errors";
import { assertModuleAccess, requireSession } from "@/services/auth.service";
import {
  canAccessContrato,
  filterContratos,
} from "@/lib/auth/scopes";
import { getContratosRepository } from "@/repositories";
import type { Contrato, CreateInput, UpdateInput } from "@/types";

export async function listarContratos() {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "contratos");
  const items = await getContratosRepository().findAll();
  return filterContratos(items, usuario);
}

/** Contratos visibles para formularios de pagos o no renovación sin abrir el módulo Contratos. */
export async function listarContratosReferencia() {
  const { usuario } = await requireSession();
  const items = await getContratosRepository().findAll();
  return filterContratos(items, usuario);
}

export async function crearContrato(data: CreateInput<Contrato>) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "contratos");
  if (usuario.rol === "ARRENDADOR") {
    data = { ...data, arrendadorId: usuario.id };
  }
  if (usuario.rol !== "ADMIN" && usuario.rol !== "ARRENDADOR") {
    throw new AuthError("No puedes crear contratos", "FORBIDDEN");
  }
  return getContratosRepository().create(data);
}

export async function actualizarContrato(id: string, data: UpdateInput<Contrato>) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "contratos");
  const existing = await getContratosRepository().findById(id);
  if (!existing || !canAccessContrato(existing, usuario)) {
    throw new AuthError("Contrato no encontrado o sin permiso", "FORBIDDEN");
  }
  if (usuario.rol === "ARRENDADOR") {
    data = { ...data, arrendadorId: usuario.id };
  }
  return getContratosRepository().update(id, data);
}

export async function eliminarContrato(id: string) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "contratos");
  if (usuario.rol === "ARRENDATARIO") {
    throw new AuthError("No puedes eliminar contratos", "FORBIDDEN");
  }
  const existing = await getContratosRepository().findById(id);
  if (!existing || !canAccessContrato(existing, usuario)) {
    throw new AuthError("Contrato no encontrado o sin permiso", "FORBIDDEN");
  }
  return getContratosRepository().delete(id);
}

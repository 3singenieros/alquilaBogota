import { requireSession } from "@/services/auth.service";
import { getUsuariosRepository } from "@/repositories";

export async function listarArrendatariosReferencia() {
  await requireSession();
  const usuarios = await getUsuariosRepository().findAll();
  return usuarios.filter((u) => u.rol === "ARRENDATARIO" && u.activo);
}

export async function listarUsuariosReferencia() {
  await requireSession();
  return getUsuariosRepository().findAll();
}

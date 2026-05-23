import { getUsuariosRepository } from "@/repositories";
import type { Rol } from "@/types";

export async function resolveRolFromEmail(email: string): Promise<Rol> {
  const normalized = email.trim().toLowerCase();
  const usuarios = await getUsuariosRepository().findAll();
  const seedUser = usuarios.find((u) => u.email.toLowerCase() === normalized);
  if (seedUser) return seedUser.rol;

  if (normalized.includes("admin")) return "ADMIN";
  if (normalized.includes("arrendador")) return "ARRENDADOR";
  if (normalized.includes("arrendatario")) return "ARRENDATARIO";
  return "ARRENDATARIO";
}

export async function resolveUsuarioIdFromEmail(
  email: string,
  firebaseUid: string
): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const usuarios = await getUsuariosRepository().findAll();
  const seedUser = usuarios.find((u) => u.email.toLowerCase() === normalized);
  return seedUser?.id ?? firebaseUid;
}

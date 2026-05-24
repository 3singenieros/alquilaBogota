import { getUsuariosRepository } from "@/repositories";
import type { Usuario } from "@/types";
import type { UserProfile } from "@/types/profile";

/** Garantiza fila en `usuarios` para FKs (inmuebles, contratos, pagos, etc.). */
export async function syncUsuarioFromProfile(profile: UserProfile): Promise<Usuario> {
  return getUsuariosRepository().syncFromProfile(profile);
}

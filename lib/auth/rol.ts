import type { Rol, Usuario } from "@/types";

export function rolEfectivo(usuario: Pick<Usuario, "rol" | "rolActivo">): Rol {
  return usuario.rolActivo ?? usuario.rol;
}

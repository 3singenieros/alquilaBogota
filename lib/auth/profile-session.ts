import type { Rol, Usuario } from "@/types";
import type { UserProfile } from "@/types/profile";

export function profileToUsuario(
  profile: UserProfile,
  photoURL?: string
): Usuario {
  return {
    id: profile.id,
    code: profile.id,
    nombre: profile.nombre,
    email: profile.email,
    rol: profile.rolActivo,
    roles: profile.roles,
    rolActivo: profile.rolActivo,
    telefono: profile.telefono,
    activo: true,
    creadoEn: profile.creadoEn,
    photoURL,
    perfilCompletado: profile.perfilCompletado,
    firebaseUid: profile.firebaseUid,
  };
}

export function isAdminEmail(email: string): boolean {
  return email.trim().toLowerCase().includes("admin");
}

/** Roles que el usuario puede elegir en onboarding (nunca ADMIN). */
export const ROLES_ONBOARDING: Rol[] = ["ARRENDADOR", "ARRENDATARIO"];

export function normalizeRolesSelection(roles: Rol[]): Rol[] {
  return ROLES_ONBOARDING.filter((r) => roles.includes(r));
}

export function defaultRolActivo(roles: Rol[]): Rol {
  if (roles.includes("ARRENDADOR")) return "ARRENDADOR";
  if (roles.includes("ARRENDATARIO")) return "ARRENDATARIO";
  return "ARRENDATARIO";
}

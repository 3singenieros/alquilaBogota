import { AuthError } from "@/lib/auth/errors";
import {
  defaultRolActivo,
  isAdminEmail,
  normalizeRolesSelection,
  profileToUsuario,
} from "@/lib/auth/profile-session";
import type { SessionTokenPayload } from "@/lib/auth/session-token";
import { auditActorFromUsuario, getAuditActor } from "@/lib/audit/actor";
import { traceEvento } from "@/lib/audit/trace-helper";
import { getProfileRepository } from "@/repositories";
import type { Rol } from "@/types";
import type { CreateProfileInput, UserProfile } from "@/types/profile";

export type ProfileLookup = {
  userId: string;
  email: string;
  firebaseUid?: string;
};

/** Busca perfil por id, firebaseUid o email (el orden importa tras onboarding con Gmail). */
export async function findProfileByLookup(
  ref: ProfileLookup
): Promise<UserProfile | null> {
  const byId = await getProfileRepository().findById(ref.userId);
  if (byId) return byId;
  if (ref.firebaseUid) {
    const byUid = await getProfileByFirebaseUid(ref.firebaseUid);
    if (byUid) return byUid;
  }
  return getProfileByEmail(ref.email);
}

/**
 * Si la cookie dice perfil completo pero el mock en RAM se reinició (HMR / dev),
 * recrea el perfil desde el payload para que cambiar rol y demás acciones funcionen.
 */
export async function ensureProfileFromSessionPayload(
  payload: SessionTokenPayload
): Promise<UserProfile | null> {
  const existing = await findProfileByLookup({
    userId: payload.userId,
    email: payload.email,
    firebaseUid: payload.firebaseUid,
  });
  if (existing) return existing;

  if (!payload.perfilCompletado || payload.roles.length === 0) {
    return null;
  }

  return getProfileRepository().create({
    id: payload.userId,
    firebaseUid: payload.firebaseUid,
    nombre: payload.displayName,
    email: payload.email.trim().toLowerCase(),
    roles: payload.roles,
    rolActivo: payload.rolActivo,
    perfilCompletado: true,
  });
}

export async function getProfileByEmail(email: string) {
  return getProfileRepository().findByEmail(email);
}

export async function getProfileByFirebaseUid(firebaseUid: string) {
  return getProfileRepository().findByFirebaseUid(firebaseUid);
}

export async function getProfileById(id: string) {
  return getProfileRepository().findById(id);
}

export async function createProfile(input: CreateProfileInput) {
  if (input.roles.includes("ADMIN")) {
    throw new AuthError("No se puede asignar rol ADMIN desde la UI", "FORBIDDEN");
  }
  return getProfileRepository().create({
    ...input,
    email: input.email.trim().toLowerCase(),
    roles: normalizeRolesSelection(input.roles),
  });
}

export async function updateActiveRole(ref: ProfileLookup, role: Rol) {
  const profile = await findProfileByLookup(ref);
  if (!profile) {
    throw new AuthError(
      "Perfil no encontrado. Cierra sesión y vuelve a entrar, o completa el onboarding.",
      "FORBIDDEN"
    );
  }
  if (!profile.roles.includes(role)) {
    throw new AuthError("No tienes ese rol asignado", "FORBIDDEN");
  }
  const anterior = profile.rolActivo;
  const updated = await getProfileRepository().update(profile.id, { rolActivo: role });
  const actor = await getAuditActor();
  await traceEvento(actor, {
    entidadTipo: "USUARIO",
    entidadId: profile.id,
    accion: "ROL_ACTIVO_CAMBIADO",
    descripcion: `Rol activo: ${anterior} → ${role}`,
    estadoAnterior: anterior,
    estadoNuevo: role,
    valoresAnteriores: { rolActivo: anterior },
    valoresNuevos: { rolActivo: role },
  });
  return updated;
}

export async function addRoleToProfile(ref: ProfileLookup, role: Rol) {
  if (role === "ADMIN") {
    throw new AuthError("El rol ADMIN no puede agregarse desde la app", "FORBIDDEN");
  }
  const profile = await findProfileByLookup(ref);
  if (!profile) {
    throw new AuthError(
      "Perfil no encontrado. Cierra sesión y vuelve a entrar, o completa el onboarding.",
      "FORBIDDEN"
    );
  }
  if (profile.roles.includes(role)) {
    return profile;
  }
  const roles = [...profile.roles, role] as Rol[];
  const updated = await getProfileRepository().update(profile.id, { roles });
  const actor = await getAuditActor();
  await traceEvento(actor, {
    entidadTipo: "USUARIO",
    entidadId: profile.id,
    accion: "ROL_AGREGADO",
    descripcion: `Rol agregado: ${role}`,
    valoresNuevos: { roles },
  });
  return updated ?? profile;
}

export async function completeOnboarding(
  firebaseUid: string,
  email: string,
  nombre: string,
  roles: Rol[],
  rolActivo: Rol,
  telefono?: string,
  photoURL?: string
) {
  const normalizedEmail = email.trim().toLowerCase();
  const selected = normalizeRolesSelection(roles);

  if (selected.length === 0) {
    throw new AuthError("Selecciona al menos un rol", "FORBIDDEN");
  }

  let finalRoles = selected;
  if (isAdminEmail(normalizedEmail)) {
    finalRoles = ["ADMIN"];
  }

  const active = finalRoles.includes(rolActivo)
    ? rolActivo
    : defaultRolActivo(finalRoles);

  const existing =
    (await getProfileByFirebaseUid(firebaseUid)) ??
    (await getProfileByEmail(normalizedEmail));

  let profile: UserProfile;
  if (existing) {
    profile =
      (await getProfileRepository().update(existing.id, {
        firebaseUid,
        nombre,
        email: normalizedEmail,
        roles: finalRoles,
        rolActivo: active,
        telefono,
        perfilCompletado: true,
      })) ?? existing;
  } else {
    profile = await createProfile({
      id: firebaseUid,
      firebaseUid,
      nombre,
      email: normalizedEmail,
      roles: finalRoles,
      rolActivo: active,
      telefono,
      perfilCompletado: true,
    });
  }

  const actor = auditActorFromUsuario(
    profileToUsuario(profile, photoURL)
  );
  await traceEvento(actor, {
    entidadTipo: "USUARIO",
    entidadId: profile.id,
    accion: "ONBOARDING_COMPLETADO",
    descripcion: `Onboarding completado — roles: ${finalRoles.join(", ")}`,
    valoresNuevos: { roles: finalRoles, rolActivo: active },
    metadata: { email: normalizedEmail },
  });

  return { profile, usuario: profileToUsuario(profile, photoURL) };
}

export function userHasRole(profile: UserProfile | null, role: Rol): boolean {
  return profile?.roles.includes(role) ?? false;
}

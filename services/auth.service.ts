import { AuthError } from "@/lib/auth/errors";
import {
  canAccessModule,
  type AppModule,
} from "@/lib/auth/permissions";
import { profileToUsuario } from "@/lib/auth/profile-session";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  verifySessionToken,
  type SessionTokenPayload,
} from "@/lib/auth/session-token";
import { getProfileRepository } from "@/repositories";
import {
  ensureProfileFromSessionPayload,
  findProfileByLookup,
} from "@/services/profile.service";
import type { AuthSession } from "@/types/auth";
import type { Rol, Usuario } from "@/types";
import { cookies } from "next/headers";

export type FirebaseSessionInput = {
  email: string;
  displayName: string;
  firebaseUid: string;
  photoURL?: string;
};

async function persistSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

async function buildUsuarioFromPayload(
  payload: SessionTokenPayload
): Promise<Usuario | null> {
  const profile =
    (await ensureProfileFromSessionPayload(payload)) ??
    (await findProfileByLookup({
      userId: payload.userId,
      email: payload.email,
      firebaseUid: payload.firebaseUid,
    }));

  if (profile?.perfilCompletado) {
    return profileToUsuario(profile, payload.photoURL);
  }

  return {
    id: payload.userId,
    code: payload.firebaseUid.slice(0, 12),
    nombre: payload.displayName,
    email: payload.email,
    rol: payload.rolActivo,
    roles: payload.roles,
    rolActivo: payload.rolActivo,
    activo: true,
    creadoEn: new Date().toISOString().slice(0, 10),
    photoURL: payload.photoURL,
    perfilCompletado: false,
    firebaseUid: payload.firebaseUid,
  };
}

export async function syncFirebaseSession(
  input: FirebaseSessionInput
): Promise<{ ok: true; usuario: Usuario; redirectTo: string }> {
  const email = input.email.trim().toLowerCase();
  if (!email) {
    throw new AuthError("Email de Firebase inválido", "UNAUTHORIZED");
  }

  const profile = await findProfileByLookup({
    userId: input.firebaseUid,
    email,
    firebaseUid: input.firebaseUid,
  });

  const displayName = input.displayName || email.split("@")[0];

  if (profile?.perfilCompletado) {
    const token = await createSessionToken({
      userId: profile.id,
      roles: profile.roles,
      rolActivo: profile.rolActivo,
      perfilCompletado: true,
      email: profile.email,
      displayName: profile.nombre || displayName,
      firebaseUid: input.firebaseUid,
      photoURL: input.photoURL,
    });
    await persistSessionCookie(token);
    const usuario = profileToUsuario(profile, input.photoURL);
    return { ok: true, usuario, redirectTo: "/" };
  }

  const token = await createSessionToken({
    userId: profile?.id ?? input.firebaseUid,
    roles: profile?.roles ?? [],
    rolActivo: profile?.rolActivo ?? "ARRENDATARIO",
    perfilCompletado: false,
    email,
    displayName,
    firebaseUid: input.firebaseUid,
    photoURL: input.photoURL,
  });
  await persistSessionCookie(token);

  const usuario = await buildUsuarioFromPayload(
    (await verifySessionToken(token))!
  );
  if (!usuario) {
    throw new AuthError("No se pudo crear la sesión", "UNAUTHORIZED");
  }

  return { ok: true, usuario, redirectTo: "/onboarding" };
}

export async function refreshSessionFromProfile(
  ref: { profileId: string; email: string; firebaseUid?: string },
  photoURL?: string
): Promise<Usuario> {
  const profile =
    (await getProfileRepository().findById(ref.profileId)) ??
    (await findProfileByLookup({
      userId: ref.profileId,
      email: ref.email,
      firebaseUid: ref.firebaseUid,
    }));
  if (!profile || !profile.perfilCompletado) {
    throw new AuthError("Perfil incompleto", "UNAUTHORIZED");
  }
  const token = await createSessionToken({
    userId: profile.id,
    roles: profile.roles,
    rolActivo: profile.rolActivo,
    perfilCompletado: true,
    email: profile.email,
    displayName: profile.nombre,
    firebaseUid: profile.firebaseUid,
    photoURL,
  });
  await persistSessionCookie(token);
  return profileToUsuario(profile, photoURL);
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE_NAME);
}

export async function getSession(): Promise<AuthSession | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const usuario = await buildUsuarioFromPayload(payload);
  if (!usuario || !usuario.activo) return null;

  return { usuario };
}

export async function requireSession(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    throw new AuthError("Sesión no válida o expirada", "UNAUTHORIZED");
  }
  return session;
}

export async function requireCompletedProfile(): Promise<AuthSession> {
  const session = await requireSession();
  if (!session.usuario.perfilCompletado) {
    throw new AuthError("Completa tu perfil para continuar", "FORBIDDEN");
  }
  return session;
}

export function assertModuleAccess(rol: Rol, module: AppModule): void {
  if (!canAccessModule(rol, module)) {
    throw new AuthError("No tienes permiso para este módulo", "FORBIDDEN");
  }
}

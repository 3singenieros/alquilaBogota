import { AuthError } from "@/lib/auth/errors";
import {
  canAccessModule,
  type AppModule,
} from "@/lib/auth/permissions";
import {
  resolveRolFromEmail,
  resolveUsuarioIdFromEmail,
} from "@/lib/auth/role-resolver";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth/session-token";
import { getUsuariosRepository } from "@/repositories";
import type { AuthSession } from "@/types/auth";
import type { Rol, Usuario } from "@/types";
import { cookies } from "next/headers";

export type FirebaseSessionInput = {
  email: string;
  displayName: string;
  firebaseUid: string;
  photoURL?: string;
};

async function buildUsuarioFromPayload(
  payload: Awaited<ReturnType<typeof verifySessionToken>> & object
): Promise<Usuario | null> {
  if (!payload) return null;
  const repo = getUsuariosRepository();
  const seed = await repo.findById(payload.userId);
  if (seed && seed.activo && seed.rol === payload.rol) {
    return {
      ...seed,
      nombre: payload.displayName || seed.nombre,
      email: payload.email,
      photoURL: payload.photoURL ?? seed.photoURL,
    };
  }

  const byEmail = (await repo.findAll()).find(
    (u) => u.email.toLowerCase() === payload.email.toLowerCase()
  );
  if (byEmail && byEmail.activo) {
    return {
      ...byEmail,
      nombre: payload.displayName || byEmail.nombre,
      email: payload.email,
      photoURL: payload.photoURL ?? byEmail.photoURL,
    };
  }

  return {
    id: payload.userId,
    code: payload.firebaseUid.slice(0, 12),
    nombre: payload.displayName || payload.email.split("@")[0],
    email: payload.email,
    rol: payload.rol,
    activo: true,
    creadoEn: new Date().toISOString().slice(0, 10),
    photoURL: payload.photoURL,
  };
}

export async function syncFirebaseSession(
  input: FirebaseSessionInput
): Promise<{ ok: true; usuario: Usuario }> {
  const email = input.email.trim().toLowerCase();
  if (!email) {
    throw new AuthError("Email de Firebase inválido", "UNAUTHORIZED");
  }

  const rol = await resolveRolFromEmail(email);
  const userId = await resolveUsuarioIdFromEmail(email, input.firebaseUid);
  const token = await createSessionToken({
    userId,
    rol,
    email,
    displayName: input.displayName || email.split("@")[0],
    firebaseUid: input.firebaseUid,
    photoURL: input.photoURL,
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  const usuario = await buildUsuarioFromPayload(
    (await verifySessionToken(token))!
  );
  if (!usuario) {
    throw new AuthError("No se pudo crear la sesión", "UNAUTHORIZED");
  }

  return { ok: true, usuario };
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

export function assertModuleAccess(rol: Rol, module: AppModule): void {
  if (!canAccessModule(rol, module)) {
    throw new AuthError("No tienes permiso para este módulo", "FORBIDDEN");
  }
}

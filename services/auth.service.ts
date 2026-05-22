import { MOCK_CREDENTIALS } from "@/lib/auth/mock-credentials";
import { AuthError } from "@/lib/auth/errors";
import {
  canAccessModule,
  type AppModule,
} from "@/lib/auth/permissions";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth/session-token";
import { getUsuariosRepository } from "@/repositories";
import type { AuthSession } from "@/types/auth";
import type { Rol, Usuario } from "@/types";
import { cookies } from "next/headers";

export async function login(
  username: string,
  password: string
): Promise<{ ok: true; usuario: Usuario } | { ok: false }> {
  const key = username.trim().toLowerCase();
  const cred = MOCK_CREDENTIALS[key];
  if (!cred || cred.password !== password) {
    return { ok: false };
  }

  const usuario = await getUsuariosRepository().findById(cred.userId);
  if (!usuario || !usuario.activo || usuario.rol !== cred.rol) {
    return { ok: false };
  }

  const token = await createSessionToken(usuario.id, usuario.rol);
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

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

  const usuario = await getUsuariosRepository().findById(payload.userId);
  if (!usuario || !usuario.activo || usuario.rol !== payload.rol) {
    return null;
  }

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

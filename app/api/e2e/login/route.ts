import {
  createE2eSessionTokenForRole,
  isE2eModeEnabled,
  parseE2eRole,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/e2e-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!isE2eModeEnabled()) {
    return NextResponse.json({ error: "E2E auth deshabilitado" }, { status: 403 });
  }

  let body: { role?: unknown };
  try {
    body = (await request.json()) as { role?: unknown };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const role = parseE2eRole(body.role);
  if (!role) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }

  const token = await createE2eSessionTokenForRole(role);
  const response = NextResponse.json({ ok: true, role });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}

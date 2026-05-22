"use server";

import { login, logout } from "@/services/auth.service";
import { redirect } from "next/navigation";

export type LoginFormState = {
  error?: string;
};

export async function loginAction(
  _prev: LoginFormState | null,
  formData: FormData
): Promise<LoginFormState> {
  const usuario = String(formData.get("usuario") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!usuario || !password) {
    return { error: "Usuario y contraseña son obligatorios" };
  }

  const result = await login(usuario, password);
  if (!result.ok) {
    return { error: "Usuario o contraseña incorrectos" };
  }

  const next = String(formData.get("next") ?? "").trim();
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    redirect(next);
  }
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await logout();
  redirect("/login");
}

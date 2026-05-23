"use server";

import { logout, syncFirebaseSession, type FirebaseSessionInput } from "@/services/auth.service";
import { getSession } from "@/services/auth.service";
import { redirect } from "next/navigation";

export async function syncFirebaseSessionAction(input: FirebaseSessionInput) {
  return syncFirebaseSession(input);
}

export async function logoutAction(): Promise<void> {
  await logout();
  redirect("/login");
}

export async function redirectIfAuthenticated(nextPath?: string) {
  const session = await getSession();
  if (session) {
    redirect(nextPath && nextPath.startsWith("/") ? nextPath : "/");
  }
}

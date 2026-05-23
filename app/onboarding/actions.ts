"use server";

import { refreshSessionFromProfile } from "@/services/auth.service";
import { completeOnboarding } from "@/services/profile.service";
import type { Rol } from "@/types";
import { redirect } from "next/navigation";

export async function completeOnboardingAction(input: {
  nombre: string;
  roles: Rol[];
  telefono?: string;
  firebaseUid: string;
  email: string;
  photoURL?: string;
}) {
  const { profile } = await completeOnboarding(
    input.firebaseUid,
    input.email,
    input.nombre,
    input.roles,
    input.roles.includes("ARRENDADOR") && input.roles.includes("ARRENDATARIO")
      ? "ARRENDADOR"
      : input.roles[0] ?? "ARRENDATARIO",
    input.telefono,
    input.photoURL
  );
  await refreshSessionFromProfile(
    {
      profileId: profile.id,
      email: profile.email,
      firebaseUid: profile.firebaseUid,
    },
    input.photoURL
  );
  redirect("/");
}

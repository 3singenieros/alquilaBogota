"use server";

import { refreshSessionFromProfile } from "@/services/auth.service";
import { requireCompletedProfile } from "@/services/auth.service";
import {
  addRoleToProfile,
  findProfileByLookup,
  getProfileForSession,
  updateActiveRole,
  updateProfile,
} from "@/services/profile.service";
import type { Rol } from "@/types";
import type { RoleProfileData } from "@/types/profile";
import { revalidatePath } from "next/cache";

function profileRefFromUsuario(usuario: {
  id: string;
  email: string;
  firebaseUid?: string;
}) {
  return {
    userId: usuario.id,
    email: usuario.email,
    firebaseUid: usuario.firebaseUid,
  };
}

async function refreshAfterProfileChange(
  usuario: { id: string; email: string; firebaseUid?: string; photoURL?: string }
) {
  const profile = await findProfileByLookup(profileRefFromUsuario(usuario));
  if (!profile) {
    throw new Error("No se pudo actualizar la sesión tras el cambio de rol.");
  }
  await refreshSessionFromProfile(
    {
      profileId: profile.id,
      email: profile.email,
      firebaseUid: profile.firebaseUid,
    },
    usuario.photoURL
  );
}

export async function getCurrentProfileAction() {
  const { usuario } = await requireCompletedProfile();
  return getProfileForSession(profileRefFromUsuario(usuario));
}

export async function updateActiveRoleAction(role: Rol) {
  const { usuario } = await requireCompletedProfile();
  await updateActiveRole(profileRefFromUsuario(usuario), role);
  await refreshAfterProfileChange(usuario);
  revalidatePath("/", "layout");
}

export async function addRoleAction(
  role: Rol,
  data: RoleProfileData,
  setAsActive = false
) {
  const { usuario } = await requireCompletedProfile();
  await addRoleToProfile(profileRefFromUsuario(usuario), role, data, {
    setAsActive,
  });
  await refreshAfterProfileChange(usuario);
  revalidatePath("/", "layout");
}

export async function updateProfileAction(data: {
  nombre?: string;
  telefono?: string;
  tipoDocumento?: RoleProfileData["tipoDocumento"];
  numeroDocumento?: string;
  direccionNotificaciones?: string;
  correoNotificaciones?: string;
}) {
  const { usuario } = await requireCompletedProfile();
  const profile = await updateProfile(profileRefFromUsuario(usuario), data);
  await refreshAfterProfileChange(usuario);
  revalidatePath("/", "layout");
  return profile;
}

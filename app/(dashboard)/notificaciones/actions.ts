"use server";

import {
  listarNotificaciones,
  simularEnvioNotificacion,
} from "@/services/notificaciones.service";
import { revalidateNotificacionDependents } from "@/lib/revalidate-paths";

export async function listarNotificacionesAction() {
  return listarNotificaciones();
}

export async function simularEnvioNotificacionAction(id: string) {
  const updated = await simularEnvioNotificacion(id);
  revalidateNotificacionDependents();
  return updated;
}

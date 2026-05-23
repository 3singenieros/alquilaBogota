"use server";

import {
  aceptarInvitacionContrato,
  rechazarInvitacionContrato,
} from "@/services/invitaciones-contrato.service";
import { revalidateContratoDependents, revalidateNotificacionDependents } from "@/lib/revalidate-paths";

export async function aceptarInvitacionAction(invitationId: string) {
  const result = await aceptarInvitacionContrato(invitationId);
  revalidateContratoDependents();
  revalidateNotificacionDependents();
  return result;
}

export async function rechazarInvitacionAction(
  invitationId: string,
  motivoRechazo: string
) {
  const result = await rechazarInvitacionContrato(invitationId, motivoRechazo);
  revalidateContratoDependents();
  revalidateNotificacionDependents();
  return result;
}

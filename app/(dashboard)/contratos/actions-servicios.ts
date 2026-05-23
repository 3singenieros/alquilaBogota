"use server";

import {
  configurarServiciosContrato,
  crearServicioContrato,
  inactivarServicioContrato,
  listarServiciosContratoPorContrato,
  type ServicioContratoInput,
} from "@/services/servicios-contrato.service";
import { revalidateContratoDependents } from "@/lib/revalidate-paths";

export async function listarServiciosContratoContratoAction(contratoId: string) {
  return listarServiciosContratoPorContrato(contratoId);
}

export async function crearServicioContratoAction(
  contratoId: string,
  data: ServicioContratoInput
) {
  const created = await crearServicioContrato(contratoId, data);
  revalidateContratoDependents();
  return created;
}

export async function configurarServiciosContratoAction(
  contratoId: string,
  servicios: ServicioContratoInput[]
) {
  const created = await configurarServiciosContrato(contratoId, servicios);
  revalidateContratoDependents();
  return created;
}

export async function inactivarServicioContratoAction(id: string) {
  const updated = await inactivarServicioContrato(id);
  revalidateContratoDependents();
  return updated;
}

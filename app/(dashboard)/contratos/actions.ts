"use server";

import {
  actualizarContrato,
  crearContrato,
  eliminarContrato,
} from "@/services/contratos.service";
import { revalidateContratoDependents } from "@/lib/revalidate-paths";
import { listarContratosReferencia } from "@/services/contratos.service";
import type { Contrato, CreateInput, UpdateInput } from "@/types";

export async function listarContratosFormAction() {
  return listarContratosReferencia();
}

export async function crearContratoAction(data: CreateInput<Contrato>) {
  const created = await crearContrato(data);
  revalidateContratoDependents();
  return created;
}

export async function actualizarContratoAction(id: string, data: UpdateInput<Contrato>) {
  const updated = await actualizarContrato(id, data);
  revalidateContratoDependents();
  return updated;
}

export async function eliminarContratoAction(id: string) {
  await eliminarContrato(id);
  revalidateContratoDependents();
}

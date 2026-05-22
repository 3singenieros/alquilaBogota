"use server";

import {
  actualizarContrato,
  crearContrato,
  eliminarContrato,
} from "@/services/contratos.service";
import type { Contrato, CreateInput, UpdateInput } from "@/types";
import { revalidatePath } from "next/cache";

export async function crearContratoAction(data: CreateInput<Contrato>) {
  await crearContrato(data);
  revalidatePath("/contratos");
}

export async function actualizarContratoAction(id: string, data: UpdateInput<Contrato>) {
  await actualizarContrato(id, data);
  revalidatePath("/contratos");
}

export async function eliminarContratoAction(id: string) {
  await eliminarContrato(id);
  revalidatePath("/contratos");
}

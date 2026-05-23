"use server";

import {
  actualizarContrato,
  aplicarReajusteCanon,
  crearContrato,
  eliminarContrato,
  listarContratosReferencia,
  listarInmueblesParaContrato,
} from "@/services/contratos.service";
import { revalidateContratoDependents, revalidateNotificacionDependents } from "@/lib/revalidate-paths";
import { BusinessRuleError } from "@/lib/errors";
import type { Contrato, CreateInput, UpdateInput } from "@/types";

export async function listarContratosFormAction() {
  return listarContratosReferencia();
}

export async function listarInmueblesParaContratoFormAction(contratoIdExcluir?: string) {
  return listarInmueblesParaContrato(contratoIdExcluir);
}

export async function crearContratoAction(data: CreateInput<Contrato>) {
  try {
    const created = await crearContrato(data);
    revalidateContratoDependents();
    return { ok: true as const, data: created };
  } catch (e) {
    if (e instanceof BusinessRuleError) {
      return { ok: false as const, error: e.message };
    }
    throw e;
  }
}

export async function actualizarContratoAction(id: string, data: UpdateInput<Contrato>) {
  try {
    const updated = await actualizarContrato(id, data);
    revalidateContratoDependents();
    return { ok: true as const, data: updated };
  } catch (e) {
    if (e instanceof BusinessRuleError) {
      return { ok: false as const, error: e.message };
    }
    throw e;
  }
}

export async function eliminarContratoAction(id: string) {
  await eliminarContrato(id);
  revalidateContratoDependents();
}

export async function aplicarReajusteCanonAction(contratoId: string, porcentaje: number) {
  try {
    const updated = await aplicarReajusteCanon(contratoId, porcentaje);
    revalidateContratoDependents();
    revalidateNotificacionDependents();
    return { ok: true as const, data: updated };
  } catch (e) {
    if (e instanceof BusinessRuleError) {
      return { ok: false as const, error: e.message };
    }
    throw e;
  }
}

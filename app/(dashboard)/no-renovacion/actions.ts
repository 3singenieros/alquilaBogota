"use server";

import {
  actualizarDatosFormalesContrato,
  actualizarExpedienteNoRenovacion,
  anularExpedienteNoRenovacion,
  crearExpedienteNoRenovacion,
  generarComunicacionNoRenovacion,
  listarContratosElegiblesNoRenovacion,
  obtenerContextoExpediente,
  obtenerDatosPdfNoRenovacion,
  obtenerExpedienteNoRenovacion,
  registrarDescargaPdfNoRenovacion,
  registrarEnvioNoRenovacion,
  sincronizarPartesExpediente,
  type ActualizarDatosFormalesContratoInput,
  type RegistrarEnvioNoRenovacionInput,
} from "@/services/no-renovacion.service";
import { revalidateNotificacionDependents } from "@/lib/revalidate-paths";
import type { RolManifestante } from "@/lib/no-renovacion-build";
import type { UpdateInput, NoRenovacion } from "@/types";
import { revalidatePath } from "next/cache";

function revalidateAll() {
  revalidatePath("/no-renovacion");
  revalidatePath("/contratos");
  revalidateNotificacionDependents();
}

export async function listarContratosNoRenovacionAction() {
  return listarContratosElegiblesNoRenovacion();
}

export async function obtenerContextoNoRenovacionAction(contratoId: string) {
  return obtenerContextoExpediente(contratoId);
}

export async function crearExpedienteNoRenovacionAction(
  contratoId: string,
  manifestante?: RolManifestante
) {
  const created = await crearExpedienteNoRenovacion(contratoId, manifestante);
  revalidateAll();
  return created;
}

export async function obtenerExpedienteNoRenovacionAction(id: string) {
  return obtenerExpedienteNoRenovacion(id);
}

export async function actualizarExpedienteNoRenovacionAction(
  id: string,
  data: UpdateInput<NoRenovacion>
) {
  const updated = await actualizarExpedienteNoRenovacion(id, data);
  revalidateAll();
  return updated;
}

export async function actualizarDatosFormalesContratoAction(
  contratoId: string,
  datos: ActualizarDatosFormalesContratoInput
) {
  const updated = await actualizarDatosFormalesContrato(contratoId, datos);
  revalidatePath("/contratos");
  revalidatePath("/no-renovacion");
  return updated;
}

export async function sincronizarPartesExpedienteAction(id: string) {
  const updated = await sincronizarPartesExpediente(id);
  revalidateAll();
  return updated;
}

export async function generarComunicacionNoRenovacionAction(id: string) {
  const updated = await generarComunicacionNoRenovacion(id);
  revalidateAll();
  return updated;
}

export async function registrarDescargaPdfNoRenovacionAction(id: string) {
  await registrarDescargaPdfNoRenovacion(id);
}

export async function obtenerDatosPdfNoRenovacionAction(id: string) {
  return obtenerDatosPdfNoRenovacion(id);
}

export async function registrarEnvioNoRenovacionAction(
  id: string,
  input: RegistrarEnvioNoRenovacionInput
) {
  const updated = await registrarEnvioNoRenovacion(id, input);
  revalidateAll();
  return updated;
}

export async function anularExpedienteNoRenovacionAction(id: string) {
  const updated = await anularExpedienteNoRenovacion(id);
  revalidateAll();
  return updated;
}

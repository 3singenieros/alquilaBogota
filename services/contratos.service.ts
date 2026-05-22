import { getContratosRepository } from "@/repositories";
import type { Contrato, CreateInput, UpdateInput } from "@/types";

export async function listarContratos() {
  return getContratosRepository().findAll();
}

export async function crearContrato(data: CreateInput<Contrato>) {
  return getContratosRepository().create(data);
}

export async function actualizarContrato(id: string, data: UpdateInput<Contrato>) {
  return getContratosRepository().update(id, data);
}

export async function eliminarContrato(id: string) {
  return getContratosRepository().delete(id);
}

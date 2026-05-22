import { getPagosRepository } from "@/repositories";
import type { CreateInput, PagoReportado, UpdateInput } from "@/types";

export async function listarPagos() {
  return getPagosRepository().findAll();
}

export async function crearPago(data: CreateInput<PagoReportado>) {
  return getPagosRepository().create(data);
}

export async function actualizarPago(id: string, data: UpdateInput<PagoReportado>) {
  return getPagosRepository().update(id, data);
}

export async function eliminarPago(id: string) {
  return getPagosRepository().delete(id);
}

import { seedTrazabilidad } from "@/data/mock/seed-trazabilidad";
import { createMockStore, newId } from "@/repositories/mock-store";
import type { EventoTrazabilidad, RegistrarEventoInput } from "@/types/trazabilidad";

export interface TrazabilidadRepository {
  findAll(): Promise<EventoTrazabilidad[]>;
  findById(id: string): Promise<EventoTrazabilidad | null>;
  create(data: RegistrarEventoInput): Promise<EventoTrazabilidad>;
}

const mockStore = createMockStore(seedTrazabilidad);

export const trazabilidadMockRepository: TrazabilidadRepository = {
  findAll: async () =>
    [...mockStore.getAll()].sort((a, b) => b.fechaHora.localeCompare(a.fechaHora)),
  findById: async (id) => mockStore.getById(id),
  create: async (data) => {
    const item: EventoTrazabilidad = {
      id: newId("trz"),
      fechaHora: new Date().toISOString(),
      usuarioId: data.usuarioId ?? "system",
      usuarioNombre: data.usuarioNombre ?? "Sistema",
      usuarioEmail: data.usuarioEmail ?? "system@app.local",
      usuarioRol: data.usuarioRol ?? "SISTEMA",
      entidadTipo: data.entidadTipo,
      entidadId: data.entidadId,
      contratoId: data.contratoId,
      inmuebleId: data.inmuebleId,
      pagoId: data.pagoId,
      usuarioAfectadoId: data.usuarioAfectadoId,
      accion: data.accion,
      estadoAnterior: data.estadoAnterior,
      estadoNuevo: data.estadoNuevo,
      descripcion: data.descripcion,
      valoresAnteriores: data.valoresAnteriores,
      valoresNuevos: data.valoresNuevos,
      metadata: data.metadata,
    };
    return mockStore.create(item);
  },
};

export { trazabilidadSupabaseRepository } from "@/repositories/supabase/supabase-trazabilidad.repository";

import { createMockStore } from "@/repositories/mock-store";
import type { ArchivoAdjunto } from "@/types";
import type { EntidadTipoTrazabilidad } from "@/types/trazabilidad";

export type ArchivoAdjuntoRecord = ArchivoAdjunto & {
  entidadTipo?: string;
  entidadId?: string;
  contratoId?: string;
  inmuebleId?: string;
};

export interface FileRepository {
  findById(id: string): Promise<ArchivoAdjuntoRecord | null>;
  findByEntidad(entidadTipo: string, entidadId: string): Promise<ArchivoAdjuntoRecord[]>;
  create(data: Omit<ArchivoAdjuntoRecord, "id"> & { id?: string }): Promise<ArchivoAdjuntoRecord>;
  delete(id: string): Promise<boolean>;
  linkToContrato(contratoId: string, archivoId: string, tipo?: string): Promise<void>;
  linkToMantenimiento(mantenimientoId: string, archivoId: string, tipo?: string): Promise<void>;
}

const mockStore = createMockStore<ArchivoAdjuntoRecord>([]);

export const fileMockRepository: FileRepository = {
  findById: async (id) => mockStore.getById(id),
  findByEntidad: async (entidadTipo, entidadId) =>
    mockStore.getAll().filter(
      (a) => a.entidadTipo === entidadTipo && a.entidadId === entidadId
    ),
  create: async (data) => {
    const item: ArchivoAdjuntoRecord = {
      ...data,
      id: data.id ?? `adj-mock-${Date.now()}`,
      fechaCarga: data.fechaCarga ?? new Date().toISOString(),
    };
    return mockStore.create(item);
  },
  delete: async (id) => mockStore.remove(id),
  linkToContrato: async () => {},
  linkToMantenimiento: async () => {},
};

export { fileSupabaseRepository } from "@/repositories/supabase/supabase-file.repository";

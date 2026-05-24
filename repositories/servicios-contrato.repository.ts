import { seedServiciosContrato } from "@/data/mock/seed-servicios-contrato";
import { ENTITY_CODE_PREFIX } from "@/lib/entity-codes";
import { buildMockEntity } from "@/lib/mock-create";
import { createMockStore } from "@/repositories/mock-store";
import type { CreateInput, ServicioPublicoContrato, UpdateInput } from "@/types";

export interface ServiciosContratoRepository {
  findAll(): Promise<ServicioPublicoContrato[]>;
  findById(id: string): Promise<ServicioPublicoContrato | null>;
  findByContratoId(contratoId: string): Promise<ServicioPublicoContrato[]>;
  create(data: CreateInput<ServicioPublicoContrato>): Promise<ServicioPublicoContrato>;
  update(
    id: string,
    data: UpdateInput<ServicioPublicoContrato>
  ): Promise<ServicioPublicoContrato | null>;
  delete(id: string): Promise<boolean>;
}

const mockStore = createMockStore(seedServiciosContrato);

export const serviciosContratoMockRepository: ServiciosContratoRepository = {
  findAll: async () => mockStore.getAll(),
  findById: async (id) => mockStore.getById(id),
  findByContratoId: async (contratoId) =>
    mockStore.getAll().filter((s) => s.contratoId === contratoId),
  create: async (data) => {
    const item = buildMockEntity<ServicioPublicoContrato>(
      ENTITY_CODE_PREFIX.servicioContrato,
      data,
      mockStore.getAll()
    );
    return mockStore.create(item);
  },
  update: async (id, data) => mockStore.update(id, data),
  delete: async (id) => mockStore.remove(id),
};

export { serviciosContratoSupabaseRepository } from "@/repositories/supabase/supabase-services.repository";

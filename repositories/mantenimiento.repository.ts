import { seedMantenimiento } from "@/data/mock/seed";
import { ENTITY_CODE_PREFIX } from "@/lib/entity-codes";
import { buildMockEntity } from "@/lib/mock-create";
import { createMockStore } from "@/repositories/mock-store";
import type { CreateInput, Mantenimiento, UpdateInput } from "@/types";

export interface MantenimientoRepository {
  findAll(): Promise<Mantenimiento[]>;
  findById(id: string): Promise<Mantenimiento | null>;
  create(data: CreateInput<Mantenimiento>): Promise<Mantenimiento>;
  update(id: string, data: UpdateInput<Mantenimiento>): Promise<Mantenimiento | null>;
  delete(id: string): Promise<boolean>;
}

const mockStore = createMockStore(seedMantenimiento);

export const mantenimientoMockRepository: MantenimientoRepository = {
  findAll: async () => mockStore.getAll(),
  findById: async (id) => mockStore.getById(id),
  create: async (data) => {
    const item = buildMockEntity<Mantenimiento>(
      ENTITY_CODE_PREFIX.mantenimiento,
      {
        ...data,
        creadoEn: data.creadoEn ?? new Date().toISOString().slice(0, 10),
      },
      mockStore.getAll()
    );
    return mockStore.create(item);
  },
  update: async (id, data) => mockStore.update(id, data),
  delete: async (id) => mockStore.remove(id),
};

export { mantenimientoSupabaseRepository } from "@/repositories/supabase/supabase-maintenance.repository";

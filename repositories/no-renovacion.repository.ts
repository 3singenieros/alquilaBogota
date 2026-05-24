import { seedNoRenovacion } from "@/data/mock/seed";
import { ENTITY_CODE_PREFIX } from "@/lib/entity-codes";
import { buildMockEntity } from "@/lib/mock-create";
import { createMockStore } from "@/repositories/mock-store";
import type { CreateInput, NoRenovacion, UpdateInput } from "@/types";

export interface NoRenovacionRepository {
  findAll(): Promise<NoRenovacion[]>;
  findById(id: string): Promise<NoRenovacion | null>;
  create(data: CreateInput<NoRenovacion>): Promise<NoRenovacion>;
  update(id: string, data: UpdateInput<NoRenovacion>): Promise<NoRenovacion | null>;
  delete(id: string): Promise<boolean>;
}

const mockStore = createMockStore(seedNoRenovacion);

export const noRenovacionMockRepository: NoRenovacionRepository = {
  findAll: async () => mockStore.getAll(),
  findById: async (id) => mockStore.getById(id),
  create: async (data) => {
    const item = buildMockEntity<NoRenovacion>(
      ENTITY_CODE_PREFIX.noRenovacion,
      data,
      mockStore.getAll()
    );
    return mockStore.create(item);
  },
  update: async (id, data) => mockStore.update(id, data),
  delete: async (id) => mockStore.remove(id),
};

export { noRenovacionSupabaseRepository } from "@/repositories/supabase/supabase-nonrenewal.repository";

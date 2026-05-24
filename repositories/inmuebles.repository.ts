import { seedInmuebles } from "@/data/mock/seed";
import { ENTITY_CODE_PREFIX } from "@/lib/entity-codes";
import { buildMockEntity } from "@/lib/mock-create";
import { createMockStore } from "@/repositories/mock-store";
import type { CreateInput, Inmueble, UpdateInput } from "@/types";

export interface InmueblesRepository {
  findAll(): Promise<Inmueble[]>;
  findById(id: string): Promise<Inmueble | null>;
  create(data: CreateInput<Inmueble>): Promise<Inmueble>;
  update(id: string, data: UpdateInput<Inmueble>): Promise<Inmueble | null>;
  delete(id: string): Promise<boolean>;
}

const mockStore = createMockStore(seedInmuebles);

export const inmueblesMockRepository: InmueblesRepository = {
  findAll: async () => mockStore.getAll(),
  findById: async (id) => mockStore.getById(id),
  create: async (data) => {
    const item = buildMockEntity<Inmueble>(
      ENTITY_CODE_PREFIX.inmueble,
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

export { inmueblesSupabaseRepository } from "@/repositories/supabase/supabase-property.repository";

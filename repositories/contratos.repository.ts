import { seedContratos } from "@/data/mock/seed";
import { ENTITY_CODE_PREFIX } from "@/lib/entity-codes";
import { buildMockEntity } from "@/lib/mock-create";
import { createMockStore } from "@/repositories/mock-store";
import type { Contrato, CreateInput, UpdateInput } from "@/types";

export interface ContratosRepository {
  findAll(): Promise<Contrato[]>;
  findById(id: string): Promise<Contrato | null>;
  create(data: CreateInput<Contrato>): Promise<Contrato>;
  update(id: string, data: UpdateInput<Contrato>): Promise<Contrato | null>;
  delete(id: string): Promise<boolean>;
}

const mockStore = createMockStore(seedContratos);

export const contratosMockRepository: ContratosRepository = {
  findAll: async () => mockStore.getAll(),
  findById: async (id) => mockStore.getById(id),
  create: async (data) => {
    const item = buildMockEntity<Contrato>(
      ENTITY_CODE_PREFIX.contrato,
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

export { contratosSupabaseRepository } from "@/repositories/supabase/supabase-contract.repository";

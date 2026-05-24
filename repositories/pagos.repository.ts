import { seedPagos } from "@/data/mock/seed";
import { ENTITY_CODE_PREFIX } from "@/lib/entity-codes";
import { buildMockEntity } from "@/lib/mock-create";
import { createMockStore } from "@/repositories/mock-store";
import type { CreateInput, PagoReportado, UpdateInput } from "@/types";

export interface PagosRepository {
  findAll(): Promise<PagoReportado[]>;
  findById(id: string): Promise<PagoReportado | null>;
  create(data: CreateInput<PagoReportado>): Promise<PagoReportado>;
  update(id: string, data: UpdateInput<PagoReportado>): Promise<PagoReportado | null>;
  delete(id: string): Promise<boolean>;
}

const mockStore = createMockStore(seedPagos);

export const pagosMockRepository: PagosRepository = {
  findAll: async () => mockStore.getAll(),
  findById: async (id) => mockStore.getById(id),
  create: async (data) => {
    const item = buildMockEntity<PagoReportado>(
      ENTITY_CODE_PREFIX.pago,
      data,
      mockStore.getAll()
    );
    return mockStore.create(item);
  },
  update: async (id, data) => mockStore.update(id, data),
  delete: async (id) => mockStore.remove(id),
};

export { pagosSupabaseRepository } from "@/repositories/supabase/supabase-payment.repository";

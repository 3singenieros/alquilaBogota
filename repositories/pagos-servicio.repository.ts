import { seedPagosServicio } from "@/data/mock/seed-pagos-servicio";
import { ENTITY_CODE_PREFIX, generateUniqueCode } from "@/lib/entity-codes";
import { buildMockEntity } from "@/lib/mock-create";
import { createMockStore } from "@/repositories/mock-store";
import type { CreateInput, PagoServicioPublico, UpdateInput } from "@/types";

export interface PagosServicioRepository {
  findAll(): Promise<PagoServicioPublico[]>;
  findById(id: string): Promise<PagoServicioPublico | null>;
  findByServicioContratoId(servicioId: string): Promise<PagoServicioPublico[]>;
  create(data: CreateInput<PagoServicioPublico>): Promise<PagoServicioPublico>;
  update(id: string, data: UpdateInput<PagoServicioPublico>): Promise<PagoServicioPublico | null>;
  delete(id: string): Promise<boolean>;
}

const mockStore = createMockStore(seedPagosServicio);

export const pagosServicioMockRepository: PagosServicioRepository = {
  findAll: async () => mockStore.getAll(),
  findById: async (id) => mockStore.getById(id),
  findByServicioContratoId: async (servicioId) =>
    mockStore.getAll().filter((p) => p.servicioPublicoContratoId === servicioId),
  create: async (data) => {
    const item = buildMockEntity<PagoServicioPublico>(
      ENTITY_CODE_PREFIX.pagoServicio,
      data,
      mockStore.getAll()
    );
    return mockStore.create(item);
  },
  update: async (id, data) => mockStore.update(id, data),
  delete: async (id) => mockStore.remove(id),
};

export const pagosServicioSupabaseRepository: PagosServicioRepository = {
  findAll: async () => [],
  findById: async () => null,
  findByServicioContratoId: async () => [],
  create: async () => {
    throw new Error("Supabase no configurado para pagos de servicio");
  },
  update: async () => null,
  delete: async () => false,
};

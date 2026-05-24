import { seedSoportesPago } from "@/data/mock/seed-soportes-pago";
import { createMockStore, newId } from "@/repositories/mock-store";
import type { SoportePago } from "@/types/soporte-pago";

export type CreateSoportePagoInput = Omit<SoportePago, "id" | "numeroSoporte"> &
  Partial<Pick<SoportePago, "id" | "numeroSoporte">>;

export interface SoportePagoRepository {
  findAll(): Promise<SoportePago[]>;
  findById(id: string): Promise<SoportePago | null>;
  findByPagoId(pagoId: string): Promise<SoportePago | null>;
  create(data: CreateSoportePagoInput): Promise<SoportePago>;
  update(id: string, data: Partial<SoportePago>): Promise<SoportePago | null>;
}

function nextNumeroSoporte(existing: SoportePago[]): string {
  const year = new Date().getFullYear();
  const prefix = `SP-${year}-`;
  const nums = existing
    .filter((s) => s.numeroSoporte.startsWith(prefix))
    .map((s) => parseInt(s.numeroSoporte.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

const mockStore = createMockStore(seedSoportesPago);

export const soportePagoMockRepository: SoportePagoRepository = {
  findAll: async () => mockStore.getAll(),
  findById: async (id) => mockStore.getById(id),
  findByPagoId: async (pagoId) =>
    mockStore.getAll().find((s) => s.pagoId === pagoId) ?? null,
  create: async (data) => {
    const all = mockStore.getAll();
    const item: SoportePago = {
      id: data.id ?? newId("sp"),
      pagoId: data.pagoId,
      contratoId: data.contratoId,
      arrendadorId: data.arrendadorId,
      arrendatarioId: data.arrendatarioId,
      numeroSoporte: data.numeroSoporte ?? nextNumeroSoporte(all),
      fechaGeneracion: data.fechaGeneracion,
      monto: data.monto,
      periodo: data.periodo,
      medioPago: data.medioPago,
      observaciones: data.observaciones,
      estadoEnvioEmail: data.estadoEnvioEmail,
    };
    return mockStore.create(item);
  },
  update: async (id, data) => mockStore.update(id, data),
};

export { soportePagoSupabaseRepository } from "@/repositories/supabase/supabase-payment.repository";

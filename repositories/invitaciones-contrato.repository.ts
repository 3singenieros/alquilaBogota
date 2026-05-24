import { seedInvitacionesContrato } from "@/data/mock/seed";
import { createMockStore } from "@/repositories/mock-store";
import type { CreateInput, InvitacionContrato, UpdateInput } from "@/types";

export interface InvitacionesContratoRepository {
  findAll(): Promise<InvitacionContrato[]>;
  findById(id: string): Promise<InvitacionContrato | null>;
  findByContratoId(contratoId: string): Promise<InvitacionContrato | null>;
  create(data: CreateInput<InvitacionContrato>): Promise<InvitacionContrato>;
  update(id: string, data: UpdateInput<InvitacionContrato>): Promise<InvitacionContrato | null>;
}

const mockStore = createMockStore(seedInvitacionesContrato);

export const invitacionesContratoMockRepository: InvitacionesContratoRepository = {
  findAll: async () => mockStore.getAll(),
  findById: async (id) => mockStore.getById(id),
  findByContratoId: async (contratoId) =>
    mockStore.getAll().find((i) => i.contratoId === contratoId) ?? null,
  create: async (data) => {
    const item: InvitacionContrato = {
      ...data,
      id: `inv-${Date.now()}`,
    };
    return mockStore.create(item);
  },
  update: async (id, data) => mockStore.update(id, data),
};

export { invitacionesContratoSupabaseRepository } from "@/repositories/supabase/supabase-contract.repository";

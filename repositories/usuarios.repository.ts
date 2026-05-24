import { seedUsuarios } from "@/data/mock/seed";
import { ENTITY_CODE_PREFIX } from "@/lib/entity-codes";
import { buildMockEntity } from "@/lib/mock-create";
import { createMockStore } from "@/repositories/mock-store";
import type { CreateInput, UpdateInput, Usuario } from "@/types";

export interface UsuariosRepository {
  findAll(): Promise<Usuario[]>;
  findById(id: string): Promise<Usuario | null>;
  create(data: CreateInput<Usuario>): Promise<Usuario>;
  update(id: string, data: UpdateInput<Usuario>): Promise<Usuario | null>;
  delete(id: string): Promise<boolean>;
}

const mockStore = createMockStore(seedUsuarios);

export const usuariosMockRepository: UsuariosRepository = {
  findAll: async () => mockStore.getAll(),
  findById: async (id) => mockStore.getById(id),
  create: async (data) => {
    const item = buildMockEntity<Usuario>(
      ENTITY_CODE_PREFIX.usuario,
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

export { usuariosSupabaseRepository } from "@/repositories/supabase/supabase-user.repository";

import { seedNotificaciones } from "@/data/mock/seed";
import { createMockStore } from "@/repositories/mock-store";
import type { CreateInput, Notificacion, UpdateInput } from "@/types";

export interface NotificacionesRepository {
  findAll(): Promise<Notificacion[]>;
  findById(id: string): Promise<Notificacion | null>;
  create(data: CreateInput<Notificacion>): Promise<Notificacion>;
  update(id: string, data: UpdateInput<Notificacion>): Promise<Notificacion | null>;
}

const mockStore = createMockStore(seedNotificaciones);

export const notificacionesMockRepository: NotificacionesRepository = {
  findAll: async () => mockStore.getAll(),
  findById: async (id) => mockStore.getById(id),
  create: async (data) => {
    const item: Notificacion = {
      ...data,
      id: `ntf-${Date.now()}`,
    };
    return mockStore.create(item);
  },
  update: async (id, data) => mockStore.update(id, data),
};

export { notificacionesSupabaseRepository } from "@/repositories/supabase/supabase-services.repository";

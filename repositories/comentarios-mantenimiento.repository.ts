import { seedComentariosMantenimiento } from "@/data/mock/seed-comentarios-mantenimiento";
import { ENTITY_CODE_PREFIX } from "@/lib/entity-codes";
import { newId } from "@/repositories/mock-store";
import type { ComentarioMantenimiento } from "@/types";

export interface ComentariosMantenimientoRepository {
  findAll(): Promise<ComentarioMantenimiento[]>;
  findByMantenimientoId(mantenimientoId: string): Promise<ComentarioMantenimiento[]>;
  create(
    data: Omit<ComentarioMantenimiento, "id" | "fechaCreacion">
  ): Promise<ComentarioMantenimiento>;
}

const store = [...seedComentariosMantenimiento];

export const comentariosMantenimientoMockRepository: ComentariosMantenimientoRepository = {
  findAll: async () => [...store],
  findByMantenimientoId: async (mantenimientoId) =>
    store
      .filter((c) => c.mantenimientoId === mantenimientoId)
      .sort((a, b) => a.fechaCreacion.localeCompare(b.fechaCreacion)),
  create: async (data) => {
    const item: ComentarioMantenimiento = {
      id: newId(ENTITY_CODE_PREFIX.comentarioMantenimiento),
      fechaCreacion: new Date().toISOString(),
      ...data,
    };
    store.push(item);
    return item;
  },
};

export { comentariosMantenimientoSupabaseRepository } from "@/repositories/supabase/supabase-maintenance.repository";

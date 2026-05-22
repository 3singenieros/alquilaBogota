import { seedUsuarios } from "@/data/mock/seed";
import { getSupabaseClient } from "@/lib/supabase/client";
import { createMockStore, newId } from "@/repositories/mock-store";
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
  create: async (data) =>
    mockStore.create({
      ...data,
      id: newId("u"),
      creadoEn: data.creadoEn ?? new Date().toISOString().slice(0, 10),
    }),
  update: async (id, data) => mockStore.update(id, data),
  delete: async (id) => mockStore.remove(id),
};

export const usuariosSupabaseRepository: UsuariosRepository = {
  findAll: async () => {
    const sb = getSupabaseClient();
    if (!sb) return [];
    const { data, error } = await sb.from("usuarios").select("*");
    if (error) throw error;
    return (data ?? []).map(mapRow);
  },
  findById: async (id) => {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data } = await sb.from("usuarios").select("*").eq("id", id).single();
    return data ? mapRow(data) : null;
  },
  create: async (input) => {
    const sb = getSupabaseClient();
    if (!sb) throw new Error("Supabase no configurado");
    const { data, error } = await sb.from("usuarios").insert(toRow(input)).select().single();
    if (error) throw error;
    return mapRow(data);
  },
  update: async (id, input) => {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data } = await sb.from("usuarios").update(toRow(input)).eq("id", id).select().single();
    return data ? mapRow(data) : null;
  },
  delete: async (id) => {
    const sb = getSupabaseClient();
    if (!sb) return false;
    const { error } = await sb.from("usuarios").delete().eq("id", id);
    return !error;
  },
};

function mapRow(r: Record<string, unknown>): Usuario {
  return {
    id: r.id as string,
    nombre: r.nombre as string,
    email: r.email as string,
    rol: r.rol as Usuario["rol"],
    telefono: r.telefono as string | undefined,
    activo: Boolean(r.activo),
    creadoEn: r.creado_en as string,
  };
}

function toRow(i: Partial<Usuario>) {
  return {
    nombre: i.nombre,
    email: i.email,
    rol: i.rol,
    telefono: i.telefono,
    activo: i.activo,
    creado_en: i.creadoEn,
  };
}

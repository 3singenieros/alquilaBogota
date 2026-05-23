import { seedProfiles } from "@/data/mock/seed-profiles";
import { getSupabaseClient } from "@/lib/supabase/client";
import { createMockStore } from "@/repositories/mock-store";
import type { CreateProfileInput, UpdateProfileInput, UserProfile } from "@/types/profile";

export interface ProfileRepository {
  findAll(): Promise<UserProfile[]>;
  findById(id: string): Promise<UserProfile | null>;
  findByEmail(email: string): Promise<UserProfile | null>;
  findByFirebaseUid(firebaseUid: string): Promise<UserProfile | null>;
  create(data: CreateProfileInput): Promise<UserProfile>;
  update(id: string, data: UpdateProfileInput): Promise<UserProfile | null>;
}

const mockStore = createMockStore(seedProfiles);

export const profileMockRepository: ProfileRepository = {
  findAll: async () => mockStore.getAll(),
  findById: async (id) => mockStore.getById(id),
  findByEmail: async (email) => {
    const normalized = email.trim().toLowerCase();
    return (
      mockStore.getAll().find((p) => p.email.toLowerCase() === normalized) ?? null
    );
  },
  findByFirebaseUid: async (firebaseUid) =>
    mockStore.getAll().find((p) => p.firebaseUid === firebaseUid) ?? null,
  create: async (data) => {
    const now = new Date().toISOString().slice(0, 10);
    const item: UserProfile = {
      id: data.id ?? `prof-${Date.now()}`,
      firebaseUid: data.firebaseUid,
      nombre: data.nombre,
      email: data.email.trim().toLowerCase(),
      roles: data.roles,
      rolActivo: data.rolActivo,
      telefono: data.telefono,
      perfilCompletado: data.perfilCompletado,
      creadoEn: data.creadoEn ?? now,
      actualizadoEn: now,
    };
    return mockStore.create(item);
  },
  update: async (id, data) => {
    const actualizadoEn = new Date().toISOString().slice(0, 10);
    return mockStore.update(id, { ...data, actualizadoEn });
  },
};

export const profileSupabaseRepository: ProfileRepository = {
  findAll: async () => {
    const sb = getSupabaseClient();
    if (!sb) return [];
    const { data, error } = await sb.from("profiles").select("*");
    if (error) throw error;
    return (data ?? []).map(mapRow);
  },
  findById: async (id) => {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data } = await sb.from("profiles").select("*").eq("id", id).single();
    return data ? mapRow(data) : null;
  },
  findByEmail: async (email) => {
    const items = await profileSupabaseRepository.findAll();
    const normalized = email.trim().toLowerCase();
    return items.find((p) => p.email.toLowerCase() === normalized) ?? null;
  },
  findByFirebaseUid: async (firebaseUid) => {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data } = await sb
      .from("profiles")
      .select("*")
      .eq("firebase_uid", firebaseUid)
      .maybeSingle();
    return data ? mapRow(data) : null;
  },
  create: async (input) => {
    const sb = getSupabaseClient();
    if (!sb) throw new Error("Supabase no configurado");
    const { data, error } = await sb.from("profiles").insert(toRow(input)).select().single();
    if (error) throw error;
    return mapRow(data);
  },
  update: async (id, input) => {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data } = await sb
      .from("profiles")
      .update(toRow(input))
      .eq("id", id)
      .select()
      .single();
    return data ? mapRow(data) : null;
  },
};

function mapRow(r: Record<string, unknown>): UserProfile {
  return {
    id: r.id as string,
    firebaseUid: r.firebase_uid as string,
    nombre: r.nombre as string,
    email: r.email as string,
    roles: r.roles as UserProfile["roles"],
    rolActivo: r.rol_activo as UserProfile["rolActivo"],
    telefono: r.telefono as string | undefined,
    perfilCompletado: Boolean(r.perfil_completado),
    creadoEn: r.creado_en as string,
    actualizadoEn: r.actualizado_en as string | undefined,
  };
}

function toRow(p: Partial<UserProfile>) {
  return {
    firebase_uid: p.firebaseUid,
    nombre: p.nombre,
    email: p.email,
    roles: p.roles,
    rol_activo: p.rolActivo,
    telefono: p.telefono,
    perfil_completado: p.perfilCompletado,
    creado_en: p.creadoEn,
    actualizado_en: p.actualizadoEn,
  };
}

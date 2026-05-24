import { seedProfiles } from "@/data/mock/seed-profiles";
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

export { profileSupabaseRepository } from "@/repositories/supabase/supabase-user.repository";

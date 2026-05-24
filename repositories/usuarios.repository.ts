import { seedUsuarios } from "@/data/mock/seed";
import { profileToUsuario } from "@/lib/auth/profile-session";
import { ENTITY_CODE_PREFIX } from "@/lib/entity-codes";
import { buildMockEntity } from "@/lib/mock-create";
import { createMockStore } from "@/repositories/mock-store";
import type { CreateInput, UpdateInput, Usuario } from "@/types";
import type { UserProfile } from "@/types/profile";

export interface UsuariosRepository {
  findAll(): Promise<Usuario[]>;
  findById(id: string): Promise<Usuario | null>;
  create(data: CreateInput<Usuario>): Promise<Usuario>;
  update(id: string, data: UpdateInput<Usuario>): Promise<Usuario | null>;
  delete(id: string): Promise<boolean>;
  /** Replica el perfil Firebase en `usuarios` (FK de inmuebles, contratos, etc.). */
  syncFromProfile(profile: UserProfile): Promise<Usuario>;
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
  syncFromProfile: async (profile) => {
    const usuario = profileToUsuario(profile);
    const byId = mockStore.getById(profile.id);
    if (byId) {
      const updated = mockStore.update(profile.id, {
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rolActivo,
        roles: usuario.roles,
        rolActivo: usuario.rolActivo,
        telefono: usuario.telefono,
        tipoDocumento: usuario.tipoDocumento,
        numeroDocumento: usuario.numeroDocumento,
        direccionNotificaciones: usuario.direccionNotificaciones,
        correoNotificaciones: usuario.correoNotificaciones,
        activo: usuario.activo,
        perfilCompletado: usuario.perfilCompletado,
        firebaseUid: usuario.firebaseUid,
      });
      return updated ?? byId;
    }
    const byEmail = mockStore
      .getAll()
      .find((u) => u.email.toLowerCase() === usuario.email.toLowerCase());
    if (byEmail) {
      const updated = mockStore.update(byEmail.id, {
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rolActivo,
        roles: usuario.roles,
        rolActivo: usuario.rolActivo,
        telefono: usuario.telefono,
        tipoDocumento: usuario.tipoDocumento,
        numeroDocumento: usuario.numeroDocumento,
        direccionNotificaciones: usuario.direccionNotificaciones,
        correoNotificaciones: usuario.correoNotificaciones,
        activo: usuario.activo,
        perfilCompletado: usuario.perfilCompletado,
        firebaseUid: usuario.firebaseUid,
      });
      return updated ?? byEmail;
    }
    return mockStore.create({
      ...usuario,
      id: profile.id,
      code: usuario.code,
      creadoEn: usuario.creadoEn,
    });
  },
};

export { usuariosSupabaseRepository } from "@/repositories/supabase/supabase-user.repository";

import { ENTITY_CODE_PREFIX, generateUniqueCode } from "@/lib/entity-codes";
import { profileToUsuario } from "@/lib/auth/profile-session";
import { requireSupabase, extractEntityCodes } from "@/lib/supabase/helpers";
import type { UsuariosRepository } from "@/repositories/usuarios.repository";
import type { ProfileRepository } from "@/repositories/profile.repository";
import type { CreateInput, UpdateInput, Usuario } from "@/types";
import type { CreateProfileInput, UpdateProfileInput, UserProfile } from "@/types/profile";

function mapUsuarioRow(r: Record<string, unknown>): Usuario {
  const rol = r.rol as Usuario["rol"];
  const roles = (r.roles as Usuario["roles"] | undefined) ?? [rol];
  const rolActivo = (r.rol_activo as Usuario["rolActivo"] | undefined) ?? rol;
  return {
    id: r.id as string,
    code: r.code as string,
    nombre: r.nombre as string,
    email: r.email as string,
    rol: rolActivo,
    roles,
    rolActivo,
    telefono: r.telefono as string | undefined,
    tipoDocumento: r.tipo_documento as Usuario["tipoDocumento"],
    numeroDocumento: r.numero_documento as string | undefined,
    direccionNotificaciones: r.direccion_notificaciones as string | undefined,
    correoNotificaciones: r.correo_notificaciones as string | undefined,
    activo: Boolean(r.activo),
    creadoEn: r.creado_en as string,
    perfilCompletado: Boolean(r.perfil_completado ?? true),
    firebaseUid: r.firebase_uid as string | undefined,
  };
}

function toUsuarioRow(i: Partial<Usuario>) {
  return {
    nombre: i.nombre,
    email: i.email,
    rol: i.rol,
    rol_activo: i.rolActivo,
    telefono: i.telefono,
    tipo_documento: i.tipoDocumento,
    numero_documento: i.numeroDocumento,
    direccion_notificaciones: i.direccionNotificaciones,
    correo_notificaciones: i.correoNotificaciones,
    activo: i.activo,
    creado_en: i.creadoEn,
    perfil_completado: i.perfilCompletado,
    firebase_uid: i.firebaseUid,
  };
}

function mapProfileRow(r: Record<string, unknown>): UserProfile {
  return {
    id: r.id as string,
    firebaseUid: r.firebase_uid as string,
    nombre: r.nombre as string,
    email: r.email as string,
    roles: r.roles as UserProfile["roles"],
    rolActivo: r.rol_activo as UserProfile["rolActivo"],
    telefono: r.telefono as string | undefined,
    tipoDocumento: r.tipo_documento as UserProfile["tipoDocumento"],
    numeroDocumento: r.numero_documento as string | undefined,
    direccionNotificaciones: r.direccion_notificaciones as string | undefined,
    correoNotificaciones: r.correo_notificaciones as string | undefined,
    perfilCompletado: Boolean(r.perfil_completado),
    creadoEn: r.creado_en as string,
    actualizadoEn: r.actualizado_en as string | undefined,
  };
}

function toProfileRow(input: Partial<UserProfile>) {
  return {
    id: input.id,
    firebase_uid: input.firebaseUid,
    nombre: input.nombre,
    email: input.email?.trim().toLowerCase(),
    roles: input.roles,
    rol_activo: input.rolActivo,
    telefono: input.telefono,
    tipo_documento: input.tipoDocumento,
    numero_documento: input.numeroDocumento,
    direccion_notificaciones: input.direccionNotificaciones,
    correo_notificaciones: input.correoNotificaciones,
    perfil_completado: input.perfilCompletado,
    creado_en: input.creadoEn,
    actualizado_en: input.actualizadoEn,
  };
}

export const supabaseUserRepository: UsuariosRepository = {
  findAll: async () => {
    const sb = requireSupabase();
    const { data, error } = await sb.from("usuarios").select("*").is("deleted_at", null);
    if (error) throw error;
    return (data ?? []).map((r) => mapUsuarioRow(r as Record<string, unknown>));
  },
  findById: async (id) => {
    const sb = requireSupabase();
    const { data } = await sb.from("usuarios").select("*").eq("id", id).maybeSingle();
    return data ? mapUsuarioRow(data as Record<string, unknown>) : null;
  },
  create: async (input) => {
    const sb = requireSupabase();
    const { data: existing } = await sb.from("usuarios").select("code");
    const code = generateUniqueCode(ENTITY_CODE_PREFIX.usuario, extractEntityCodes(existing));
    const { data, error } = await sb
      .from("usuarios")
      .insert({ ...toUsuarioRow(input), code })
      .select()
      .single();
    if (error) throw error;
    return mapUsuarioRow(data as Record<string, unknown>);
  },
  update: async (id, input) => {
    const sb = requireSupabase();
    const { data } = await sb
      .from("usuarios")
      .update(toUsuarioRow(input))
      .eq("id", id)
      .select()
      .maybeSingle();
    return data ? mapUsuarioRow(data as Record<string, unknown>) : null;
  },
  delete: async (id) => {
    const sb = requireSupabase();
    const { error } = await sb
      .from("usuarios")
      .update({ deleted_at: new Date().toISOString(), activo: false })
      .eq("id", id);
    return !error;
  },
  syncFromProfile: async (profile) => {
    const sb = requireSupabase();
    const usuario = profileToUsuario(profile);
    const { data: existingById } = await sb
      .from("usuarios")
      .select("code")
      .eq("id", profile.id)
      .maybeSingle();

    let code = existingById?.code as string | undefined;
    if (!code) {
      const { data: allCodes } = await sb.from("usuarios").select("code");
      const codes = extractEntityCodes(allCodes);
      code = codes.includes(usuario.code)
        ? generateUniqueCode(ENTITY_CODE_PREFIX.usuario, codes)
        : usuario.code;
    }

    const row = {
      id: profile.id,
      code,
      ...toUsuarioRow({
        ...usuario,
        rol: usuario.rolActivo,
      }),
    };

    const { data, error } = await sb
      .from("usuarios")
      .upsert(row, { onConflict: "id" })
      .select()
      .single();
    if (error) throw error;
    return mapUsuarioRow(data as Record<string, unknown>);
  },
};

export const supabaseProfileRepository: ProfileRepository = {
  findAll: async () => {
    const sb = requireSupabase();
    const { data, error } = await sb.from("profiles").select("*");
    if (error) throw error;
    return (data ?? []).map((r) => mapProfileRow(r as Record<string, unknown>));
  },
  findById: async (id) => {
    const sb = requireSupabase();
    const { data } = await sb.from("profiles").select("*").eq("id", id).maybeSingle();
    return data ? mapProfileRow(data as Record<string, unknown>) : null;
  },
  findByEmail: async (email) => {
    const sb = requireSupabase();
    const normalized = email.trim().toLowerCase();
    const { data } = await sb.from("profiles").select("*").eq("email", normalized).maybeSingle();
    return data ? mapProfileRow(data as Record<string, unknown>) : null;
  },
  findByFirebaseUid: async (firebaseUid) => {
    const sb = requireSupabase();
    const { data } = await sb
      .from("profiles")
      .select("*")
      .eq("firebase_uid", firebaseUid)
      .maybeSingle();
    return data ? mapProfileRow(data as Record<string, unknown>) : null;
  },
  create: async (input) => {
    const sb = requireSupabase();
    const now = new Date().toISOString().slice(0, 10);
    const { data, error } = await sb
      .from("profiles")
      .insert(toProfileRow({ ...input, creadoEn: input.creadoEn ?? now, actualizadoEn: now }))
      .select()
      .single();
    if (error) throw error;
    return mapProfileRow(data as Record<string, unknown>);
  },
  update: async (id, input) => {
    const sb = requireSupabase();
    const actualizadoEn = new Date().toISOString().slice(0, 10);
    const { data } = await sb
      .from("profiles")
      .update(toProfileRow({ ...input, actualizadoEn }))
      .eq("id", id)
      .select()
      .maybeSingle();
    return data ? mapProfileRow(data as Record<string, unknown>) : null;
  },
};

export const usuariosSupabaseRepository = supabaseUserRepository;
export const profileSupabaseRepository = supabaseProfileRepository;

import { ENTITY_CODE_PREFIX, generateUniqueCode } from "@/lib/entity-codes";
import { requireSupabase, extractEntityCodes } from "@/lib/supabase/helpers";
import type { InmueblesRepository } from "@/repositories/inmuebles.repository";
import type { CreateInput, Inmueble, UpdateInput } from "@/types";

function mapRow(row: Record<string, unknown>): Inmueble {
  return {
    id: row.id as string,
    code: row.code as string,
    titulo: row.titulo as string,
    direccion: row.direccion as string,
    ciudad: row.ciudad as string,
    localidad: row.localidad as string | undefined,
    barrio: row.barrio as string | undefined,
    estrato: row.estrato != null ? Number(row.estrato) : undefined,
    tipo: row.tipo as string,
    estado: row.estado as Inmueble["estado"],
    canonMensual: Number(row.canon_mensual),
    arrendadorId: row.arrendador_id as string,
    descripcion: row.descripcion as string | undefined,
    creadoEn: row.creado_en as string,
  };
}

function toRow(input: Partial<Inmueble>): Record<string, unknown> {
  return {
    titulo: input.titulo,
    direccion: input.direccion,
    ciudad: input.ciudad,
    localidad: input.localidad,
    barrio: input.barrio,
    estrato: input.estrato,
    tipo: input.tipo,
    estado: input.estado,
    canon_mensual: input.canonMensual,
    arrendador_id: input.arrendadorId,
    descripcion: input.descripcion,
    creado_en: input.creadoEn,
  };
}

export const supabasePropertyRepository: InmueblesRepository = {
  findAll: async () => {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("inmuebles")
      .select("*")
      .is("deleted_at", null)
      .order("creado_en", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  },
  findById: async (id) => {
    const sb = requireSupabase();
    const { data, error } = await sb.from("inmuebles").select("*").eq("id", id).maybeSingle();
    if (error) return null;
    return data ? mapRow(data as Record<string, unknown>) : null;
  },
  create: async (input) => {
    const sb = requireSupabase();
    const { data: existing } = await sb.from("inmuebles").select("code");
    const code = generateUniqueCode(ENTITY_CODE_PREFIX.inmueble, extractEntityCodes(existing));
    const { data, error } = await sb
      .from("inmuebles")
      .insert({ ...toRow(input), code })
      .select()
      .single();
    if (error) throw error;
    return mapRow(data as Record<string, unknown>);
  },
  update: async (id, input) => {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("inmuebles")
      .update(toRow(input))
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) return null;
    return data ? mapRow(data as Record<string, unknown>) : null;
  },
  delete: async (id) => {
    const sb = requireSupabase();
    const { error } = await sb
      .from("inmuebles")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    return !error;
  },
};

/** Alias para compatibilidad con el patrón existente. */
export const inmueblesSupabaseRepository = supabasePropertyRepository;

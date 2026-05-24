import { ENTITY_CODE_PREFIX, generateUniqueCode } from "@/lib/entity-codes";
import { requireSupabase, extractEntityCodes } from "@/lib/supabase/helpers";
import type { NoRenovacionRepository } from "@/repositories/no-renovacion.repository";
import type { CreateInput, NoRenovacion, UpdateInput } from "@/types";

const TABLE = "no_renovaciones" as const;

function mapRow(r: Record<string, unknown>): NoRenovacion {
  if (r.datos && typeof r.datos === "object") {
    const datos = r.datos as NoRenovacion;
    return {
      ...datos,
      id: (r.id as string) ?? datos.id,
      code: (r.code as string) ?? datos.code,
      estado: (r.estado as NoRenovacion["estado"]) ?? datos.estado,
    };
  }
  return r as unknown as NoRenovacion;
}

function toRow(i: Partial<NoRenovacion>) {
  return {
    contrato_id: i.contratoId,
    inmueble_id: i.inmuebleId,
    motivo: i.motivo,
    estado: i.estado,
    datos: i,
  };
}

export const supabaseNonRenewalRepository: NoRenovacionRepository = {
  findAll: async () => {
    const sb = requireSupabase();
    const { data, error } = await sb.from(TABLE).select("*");
    if (error) throw error;
    return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
  },
  findById: async (id) => {
    const sb = requireSupabase();
    const { data } = await sb.from(TABLE).select("*").eq("id", id).maybeSingle();
    return data ? mapRow(data as Record<string, unknown>) : null;
  },
  create: async (input) => {
    const sb = requireSupabase();
    const { data: existing } = await sb.from(TABLE).select("code");
    const code = generateUniqueCode(ENTITY_CODE_PREFIX.noRenovacion, extractEntityCodes(existing));
    const { data, error } = await sb
      .from(TABLE)
      .insert({ ...toRow(input), code })
      .select()
      .single();
    if (error) throw error;
    return mapRow(data as Record<string, unknown>);
  },
  update: async (id, input) => {
    const sb = requireSupabase();
    const { data } = await sb
      .from(TABLE)
      .update({ ...toRow(input), datos: input })
      .eq("id", id)
      .select()
      .maybeSingle();
    return data ? mapRow(data as Record<string, unknown>) : null;
  },
  delete: async (id) => {
    const sb = requireSupabase();
    const { error } = await sb.from(TABLE).delete().eq("id", id);
    return !error;
  },
};

export const noRenovacionSupabaseRepository = supabaseNonRenewalRepository;

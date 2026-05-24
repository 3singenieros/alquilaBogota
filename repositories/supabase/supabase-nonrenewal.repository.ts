import { ENTITY_CODE_PREFIX, generateUniqueCode } from "@/lib/entity-codes";
import { extractEntityCodes, requireSupabase } from "@/lib/supabase/helpers";
import type { NoRenovacionRepository } from "@/repositories/no-renovacion.repository";
import type { CreateInput, NoRenovacion, UpdateInput } from "@/types";

const TABLE = "no_renovaciones" as const;

function rowWithoutUndefined<T extends Record<string, unknown>>(row: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(row).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

function mapRow(r: Record<string, unknown>): NoRenovacion {
  const datos =
    r.datos && typeof r.datos === "object"
      ? (r.datos as Partial<NoRenovacion>)
      : {};

  return {
    ...(datos as NoRenovacion),
    id: (r.id as string) ?? datos.id ?? "",
    code: (r.code as string) ?? datos.code ?? "",
    contratoId: (r.contrato_id as string) ?? datos.contratoId ?? "",
    inmuebleId: (r.inmueble_id as string) ?? datos.inmuebleId ?? "",
    estado: (r.estado as NoRenovacion["estado"]) ?? datos.estado ?? "BORRADOR",
    motivo: (r.motivo as string | undefined) ?? datos.motivo,
  };
}

function toColumns(item: Partial<NoRenovacion>) {
  return rowWithoutUndefined({
    contrato_id: item.contratoId,
    inmueble_id: item.inmuebleId,
    motivo: item.motivo,
    estado: item.estado,
    datos: item,
  });
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
    const payload = { ...input, estado: input.estado ?? "BORRADOR" };
    const { data, error } = await sb
      .from(TABLE)
      .insert({ ...toColumns(payload), code })
      .select()
      .single();
    if (error) throw error;
    return mapRow(data as Record<string, unknown>);
  },
  update: async (id, input) => {
    const sb = requireSupabase();
    const { data: current } = await sb.from(TABLE).select("*").eq("id", id).maybeSingle();
    if (!current) return null;

    const existing = mapRow(current as Record<string, unknown>);
    const merged: NoRenovacion = {
      ...existing,
      ...input,
      id: existing.id,
      code: existing.code,
      contratoId: input.contratoId ?? existing.contratoId,
      inmuebleId: input.inmuebleId ?? existing.inmuebleId,
    };

    const { data, error } = await sb
      .from(TABLE)
      .update(toColumns(merged))
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ? mapRow(data as Record<string, unknown>) : null;
  },
  delete: async (id) => {
    const sb = requireSupabase();
    const { error } = await sb.from(TABLE).delete().eq("id", id);
    return !error;
  },
};

export const noRenovacionSupabaseRepository = supabaseNonRenewalRepository;

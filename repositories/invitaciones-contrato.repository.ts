import { seedInvitacionesContrato } from "@/data/mock/seed";
import { getSupabaseClient } from "@/lib/supabase/client";
import { createMockStore } from "@/repositories/mock-store";
import type { CreateInput, InvitacionContrato, UpdateInput } from "@/types";

export interface InvitacionesContratoRepository {
  findAll(): Promise<InvitacionContrato[]>;
  findById(id: string): Promise<InvitacionContrato | null>;
  findByContratoId(contratoId: string): Promise<InvitacionContrato | null>;
  create(data: CreateInput<InvitacionContrato>): Promise<InvitacionContrato>;
  update(id: string, data: UpdateInput<InvitacionContrato>): Promise<InvitacionContrato | null>;
}

const mockStore = createMockStore(seedInvitacionesContrato);

export const invitacionesContratoMockRepository: InvitacionesContratoRepository = {
  findAll: async () => mockStore.getAll(),
  findById: async (id) => mockStore.getById(id),
  findByContratoId: async (contratoId) =>
    mockStore.getAll().find((i) => i.contratoId === contratoId) ?? null,
  create: async (data) => {
    const item: InvitacionContrato = {
      ...data,
      id: `inv-${Date.now()}`,
    };
    return mockStore.create(item);
  },
  update: async (id, data) => mockStore.update(id, data),
};

export const invitacionesContratoSupabaseRepository: InvitacionesContratoRepository = {
  findAll: async () => {
    const sb = getSupabaseClient();
    if (!sb) return [];
    const { data, error } = await sb.from("invitaciones_contrato").select("*");
    if (error) throw error;
    return (data ?? []).map(mapRow);
  },
  findById: async (id) => {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data } = await sb.from("invitaciones_contrato").select("*").eq("id", id).single();
    return data ? mapRow(data) : null;
  },
  findByContratoId: async (contratoId) => {
    const items = await invitacionesContratoSupabaseRepository.findAll();
    return items.find((i) => i.contratoId === contratoId) ?? null;
  },
  create: async (input) => {
    const sb = getSupabaseClient();
    if (!sb) throw new Error("Supabase no configurado");
    const { data, error } = await sb.from("invitaciones_contrato").insert(toRow(input)).select().single();
    if (error) throw error;
    return mapRow(data);
  },
  update: async (id, input) => {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data } = await sb
      .from("invitaciones_contrato")
      .update(toRow(input))
      .eq("id", id)
      .select()
      .single();
    return data ? mapRow(data) : null;
  },
};

function mapRow(r: Record<string, unknown>): InvitacionContrato {
  return {
    id: r.id as string,
    contratoId: r.contrato_id as string,
    emailInvitado: r.email_invitado as string,
    nombreInvitado: r.nombre_invitado as string | undefined,
    estado: r.estado as InvitacionContrato["estado"],
    tokenInvitacion: r.token_invitacion as string,
    fechaCreacion: r.fecha_creacion as string,
    fechaRespuesta: r.fecha_respuesta as string | undefined,
    motivoRechazo: r.motivo_rechazo as string | undefined,
  };
}

function toRow(i: Partial<InvitacionContrato>) {
  return {
    contrato_id: i.contratoId,
    email_invitado: i.emailInvitado,
    nombre_invitado: i.nombreInvitado,
    estado: i.estado,
    token_invitacion: i.tokenInvitacion,
    fecha_creacion: i.fechaCreacion,
    fecha_respuesta: i.fechaRespuesta,
    motivo_rechazo: i.motivoRechazo,
  };
}

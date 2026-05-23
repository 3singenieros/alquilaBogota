import { seedNotificaciones } from "@/data/mock/seed";
import { getSupabaseClient } from "@/lib/supabase/client";
import { createMockStore } from "@/repositories/mock-store";
import type { CreateInput, Notificacion, UpdateInput } from "@/types";

export interface NotificacionesRepository {
  findAll(): Promise<Notificacion[]>;
  findById(id: string): Promise<Notificacion | null>;
  create(data: CreateInput<Notificacion>): Promise<Notificacion>;
  update(id: string, data: UpdateInput<Notificacion>): Promise<Notificacion | null>;
}

const mockStore = createMockStore(seedNotificaciones);

export const notificacionesMockRepository: NotificacionesRepository = {
  findAll: async () => mockStore.getAll(),
  findById: async (id) => mockStore.getById(id),
  create: async (data) => {
    const item: Notificacion = {
      ...data,
      id: `ntf-${Date.now()}`,
    };
    return mockStore.create(item);
  },
  update: async (id, data) => mockStore.update(id, data),
};

export const notificacionesSupabaseRepository: NotificacionesRepository = {
  findAll: async () => {
    const sb = getSupabaseClient();
    if (!sb) return [];
    const { data, error } = await sb.from("notificaciones").select("*");
    if (error) throw error;
    return (data ?? []).map(mapRow);
  },
  findById: async (id) => {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data } = await sb.from("notificaciones").select("*").eq("id", id).single();
    return data ? mapRow(data) : null;
  },
  create: async (input) => {
    const sb = getSupabaseClient();
    if (!sb) throw new Error("Supabase no configurado");
    const { data, error } = await sb.from("notificaciones").insert(toRow(input)).select().single();
    if (error) throw error;
    return mapRow(data);
  },
  update: async (id, input) => {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data } = await sb.from("notificaciones").update(toRow(input)).eq("id", id).select().single();
    return data ? mapRow(data) : null;
  },
};

function mapRow(r: Record<string, unknown>): Notificacion {
  return {
    id: r.id as string,
    contratoId: r.contrato_id as string | undefined,
    tipo: r.tipo as Notificacion["tipo"],
    destinatarioNombre: r.destinatario_nombre as string,
    destinatarioEmail: r.destinatario_email as string,
    rolDestinatario: r.rol_destinatario as Notificacion["rolDestinatario"],
    asunto: r.asunto as string,
    mensaje: r.mensaje as string,
    estado: r.estado as Notificacion["estado"],
    fechaCreacion: r.fecha_creacion as string,
    fechaEnvioSimulado: r.fecha_envio_simulado as string | undefined,
    referenciaModulo: r.referencia_modulo as string,
  };
}

function toRow(i: Partial<Notificacion>) {
  return {
    contrato_id: i.contratoId,
    tipo: i.tipo,
    destinatario_nombre: i.destinatarioNombre,
    destinatario_email: i.destinatarioEmail,
    rol_destinatario: i.rolDestinatario,
    asunto: i.asunto,
    mensaje: i.mensaje,
    estado: i.estado,
    fecha_creacion: i.fechaCreacion,
    fecha_envio_simulado: i.fechaEnvioSimulado,
    referencia_modulo: i.referenciaModulo,
  };
}

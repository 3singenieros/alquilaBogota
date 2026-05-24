/**
 * Tipos generados manualmente a partir de docs/database/supabase-schema.sql.
 * Mantener sincronizados con el esquema PostgreSQL y con types/ del dominio.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/** Escrituras flexibles para repositorios (mapeo snake_case manual). */
export type DbWrite = Record<string, unknown>;

export type Database = {
  public: {
    Tables: {
      usuarios: {
        Row: UsuarioRow;
        Insert: DbWrite;
        Update: DbWrite;
      };
      user_roles: {
        Row: UserRoleRow;
        Insert: DbWrite;
        Update: DbWrite;
      };
      profiles: {
        Row: ProfileRow;
        Insert: DbWrite;
        Update: DbWrite;
      };
      inmuebles: {
        Row: InmuebleRow;
        Insert: DbWrite;
        Update: DbWrite;
      };
      contratos: {
        Row: ContratoRow;
        Insert: DbWrite;
        Update: DbWrite;
      };
      contrato_documentos: {
        Row: ContratoDocumentoRow;
        Insert: DbWrite;
        Update: DbWrite;
      };
      invitaciones_contrato: {
        Row: InvitacionContratoRow;
        Insert: DbWrite;
        Update: DbWrite;
      };
      servicios_publicos_contrato: {
        Row: ServicioPublicoContratoRow;
        Insert: DbWrite;
        Update: DbWrite;
      };
      pagos_servicios_publicos: {
        Row: PagoServicioPublicoRow;
        Insert: DbWrite;
        Update: DbWrite;
      };
      pagos_canon: {
        Row: PagoCanonRow;
        Insert: DbWrite;
        Update: DbWrite;
      };
      soportes_pago: {
        Row: SoportePagoRow;
        Insert: DbWrite;
        Update: DbWrite;
      };
      mantenimientos: {
        Row: MantenimientoRow;
        Insert: DbWrite;
        Update: DbWrite;
      };
      mantenimiento_comentarios: {
        Row: MantenimientoComentarioRow;
        Insert: DbWrite;
        Update: DbWrite;
      };
      mantenimiento_documentos: {
        Row: MantenimientoDocumentoRow;
        Insert: DbWrite;
        Update: DbWrite;
      };
      no_renovaciones: {
        Row: NoRenovacionRow;
        Insert: DbWrite;
        Update: DbWrite;
      };
      notificaciones: {
        Row: NotificacionRow;
        Insert: DbWrite;
        Update: DbWrite;
      };
      evento_trazabilidad: {
        Row: EventoTrazabilidadRow;
        Insert: DbWrite;
        Update: DbWrite;
      };
      archivo_adjunto: {
        Row: ArchivoAdjuntoRow;
        Insert: DbWrite;
        Update: DbWrite;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_rol: "ADMIN" | "ARRENDADOR" | "ARRENDATARIO";
      estado_contrato:
        | "BORRADOR"
        | "PENDIENTE_CONFIRMACION"
        | "CONFIRMADO"
        | "RECHAZADO"
        | "CANCELADO"
        | "TERMINADO"
        | "VENCIDO";
      estado_inmueble: "DISPONIBLE" | "ARRENDADO" | "MANTENIMIENTO";
      estado_pago: "REPORTADO" | "VALIDADO" | "RECHAZADO";
      estado_pago_servicio: "PENDIENTE" | "REPORTADO" | "VALIDADO" | "RECHAZADO" | "VENCIDO";
      estado_mantenimiento: "ABIERTO" | "EN_GESTION" | "RESUELTO" | "CERRADO" | "RECHAZADO";
      estado_no_renovacion:
        | "BORRADOR"
        | "PENDIENTE_GENERACION"
        | "DOCUMENTO_GENERADO"
        | "ENVIO_REGISTRADO"
        | "ANULADA";
      tipo_mantenimiento: "LOCATIVO" | "ESTRUCTURAL" | "PREVENTIVO" | "CORRECTIVO" | "INSPECCION" | "ADMINISTRATIVO";
      tipo_responsabilidad: "ARRENDADOR" | "ARRENDATARIO" | "COMPARTIDO" | "POR_DEFINIR";
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export interface TimestampedRow {
  created_at: string;
  updated_at: string;
}

export interface UsuarioRow extends TimestampedRow {
  id: string;
  code: string;
  nombre: string;
  email: string;
  rol: Database["public"]["Enums"]["app_rol"];
  rol_activo: Database["public"]["Enums"]["app_rol"];
  telefono: string | null;
  tipo_documento: string | null;
  numero_documento: string | null;
  direccion_notificaciones: string | null;
  correo_notificaciones: string | null;
  activo: boolean;
  perfil_completado: boolean;
  firebase_uid: string | null;
  creado_en: string;
  deleted_at: string | null;
}

export interface UserRoleRow extends TimestampedRow {
  id: string;
  usuario_id: string;
  rol: Database["public"]["Enums"]["app_rol"];
}

export interface ProfileRow extends TimestampedRow {
  id: string;
  firebase_uid: string;
  nombre: string;
  email: string;
  roles: Database["public"]["Enums"]["app_rol"][];
  rol_activo: Database["public"]["Enums"]["app_rol"];
  telefono: string | null;
  tipo_documento: string | null;
  numero_documento: string | null;
  direccion_notificaciones: string | null;
  correo_notificaciones: string | null;
  perfil_completado: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface InmuebleRow extends TimestampedRow {
  id: string;
  code: string;
  titulo: string;
  direccion: string;
  ciudad: string;
  localidad: string | null;
  barrio: string | null;
  estrato: number | null;
  tipo: string;
  estado: Database["public"]["Enums"]["estado_inmueble"];
  canon_mensual: number;
  arrendador_id: string;
  descripcion: string | null;
  creado_en: string;
  deleted_at: string | null;
}

export interface ContratoRow extends TimestampedRow {
  id: string;
  code: string;
  inmueble_id: string;
  arrendatario_id: string | null;
  email_arrendatario: string;
  nombre_arrendatario: string | null;
  arrendador_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  canon_actual: number;
  canon_anterior: number;
  porcentaje_reajuste: number;
  fecha_ultimo_reajuste: string | null;
  estado: Database["public"]["Enums"]["estado_contrato"];
  documento_url: string | null;
  codeudor_nombre: string | null;
  codeudor_documento: string | null;
  codeudor_telefono: string | null;
  codeudor_email: string | null;
  deposito_garantia_valor: number;
  deposito_garantia_estado: string;
  prorroga_automatica: boolean;
  fecha_limite_preaviso: string;
  inventario_entrega: string | null;
  observaciones_entrega: string | null;
  motivo_rechazo: string | null;
  no_renovar: boolean;
  fecha_no_renovacion_registrada: string | null;
  origen_no_renovacion: string | null;
  no_renovacion_id: string | null;
  creado_en: string;
  deleted_at: string | null;
}

export interface ContratoDocumentoRow extends TimestampedRow {
  id: string;
  contrato_id: string;
  archivo_id: string;
  tipo_documento: string | null;
}

export interface InvitacionContratoRow extends TimestampedRow {
  id: string;
  contrato_id: string;
  email_invitado: string;
  nombre_invitado: string | null;
  estado: string;
  token_invitacion: string;
  fecha_creacion: string;
  fecha_respuesta: string | null;
  motivo_rechazo: string | null;
}

export interface ServicioPublicoContratoRow extends TimestampedRow {
  id: string;
  code: string;
  contrato_id: string;
  inmueble_id: string;
  tipo_servicio: string;
  empresa_prestadora: string;
  numero_cuenta_servicio: string;
  periodicidad: string;
  activo: boolean;
  observaciones: string | null;
}

export interface PagoServicioPublicoRow extends TimestampedRow {
  id: string;
  code: string;
  servicio_publico_contrato_id: string;
  contrato_id: string;
  inmueble_id: string;
  periodo: string;
  fecha_pago: string;
  fecha_reporte: string;
  fecha_vencimiento: string;
  valor_pagado: number;
  estado: Database["public"]["Enums"]["estado_pago_servicio"];
  comprobante_url: string | null;
  reportado_por_id: string;
  validado_por_id: string | null;
  fecha_validacion: string | null;
  motivo_rechazo: string | null;
  observaciones: string | null;
}

export interface PagoCanonRow extends TimestampedRow {
  id: string;
  code: string;
  contrato_id: string;
  mes: string;
  monto: number;
  fecha_reporte: string;
  estado: Database["public"]["Enums"]["estado_pago"];
  comprobante_url: string | null;
  notas: string | null;
  medio_pago: string | null;
  reportado_por_id: string;
  fecha_validacion: string | null;
  validado_por_id: string | null;
  rechazado_por_id: string | null;
  motivo_rechazo: string | null;
  soporte_pago_id: string | null;
}

export interface SoportePagoRow extends TimestampedRow {
  id: string;
  pago_id: string;
  contrato_id: string;
  arrendador_id: string;
  arrendatario_id: string;
  numero_soporte: string;
  fecha_generacion: string;
  monto: number;
  periodo: string;
  medio_pago: string | null;
  observaciones: string | null;
  estado_envio_email: string;
}

export interface MantenimientoRow extends TimestampedRow {
  id: string;
  code: string;
  inmueble_id: string;
  titulo: string;
  descripcion: string;
  prioridad: string;
  estado: Database["public"]["Enums"]["estado_mantenimiento"];
  tipo_mantenimiento: Database["public"]["Enums"]["tipo_mantenimiento"] | null;
  tipo_responsabilidad: Database["public"]["Enums"]["tipo_responsabilidad"] | null;
  valor_estimado: number | null;
  valor_final: number | null;
  porcentaje_arrendador: number | null;
  porcentaje_arrendatario: number | null;
  valor_arrendador: number | null;
  valor_arrendatario: number | null;
  fecha_estimada_atencion: string | null;
  observaciones_responsabilidad: string | null;
  observaciones_cierre: string | null;
  aceptacion_arrendatario: string | null;
  motivo_rechazo_responsabilidad: string | null;
  solicitado_por_id: string;
  asignado_a: string | null;
  observaciones_gestion: string | null;
  creado_en: string;
  fecha_cierre: string | null;
  adjunto_url: string | null;
}

export interface MantenimientoComentarioRow extends TimestampedRow {
  id: string;
  mantenimiento_id: string;
  contrato_id: string | null;
  inmueble_id: string;
  usuario_id: string;
  usuario_nombre: string;
  usuario_email: string;
  usuario_rol: Database["public"]["Enums"]["app_rol"];
  comentario: string;
  adjunto_url: string | null;
  fecha_creacion: string;
}

export interface MantenimientoDocumentoRow extends TimestampedRow {
  id: string;
  mantenimiento_id: string;
  archivo_id: string;
  tipo_documento: string | null;
}

export interface NoRenovacionRow extends TimestampedRow {
  id: string;
  code: string;
  contrato_id: string;
  inmueble_id: string;
  datos: Json;
  estado: Database["public"]["Enums"]["estado_no_renovacion"];
  motivo: string | null;
  creado_en: string;
}

export interface NotificacionRow extends TimestampedRow {
  id: string;
  tipo: string;
  contrato_id: string | null;
  destinatario_nombre: string;
  destinatario_email: string;
  rol_destinatario: Database["public"]["Enums"]["app_rol"];
  asunto: string;
  mensaje: string;
  estado: string;
  fecha_creacion: string;
  fecha_envio_simulado: string | null;
  referencia_modulo: string;
}

export interface EventoTrazabilidadRow {
  id: string;
  entidad_tipo: string;
  entidad_id: string;
  contrato_id: string | null;
  inmueble_id: string | null;
  pago_id: string | null;
  usuario_afectado_id: string | null;
  accion: string;
  estado_anterior: string | null;
  estado_nuevo: string | null;
  descripcion: string;
  usuario_id: string;
  usuario_nombre: string;
  usuario_email: string;
  usuario_rol: string;
  fecha_hora: string;
  valores_anteriores: Json | null;
  valores_nuevos: Json | null;
  metadata: Json | null;
  created_at: string;
}

export interface ArchivoAdjuntoRow extends TimestampedRow {
  id: string;
  nombre: string;
  tipo: string | null;
  tamano: number | null;
  bucket: string | null;
  path: string | null;
  public_url: string | null;
  url_simulada: string | null;
  descripcion: string | null;
  uploaded_at: string | null;
  uploaded_by: string | null;
  cargado_por_id: string | null;
  cargado_por_nombre: string | null;
  cargado_por_email: string | null;
  cargado_por_rol: string | null;
  fecha_carga: string;
}

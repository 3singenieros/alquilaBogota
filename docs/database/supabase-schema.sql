-- =============================================================================
-- AlquilaBogotá MVP — Esquema PostgreSQL (Supabase)
-- Ejecutar en SQL Editor del proyecto Supabase.
-- Documentación: docs/database/database-model.md
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- ENUMS (alineados con types/index.ts y types/trazabilidad.ts)
-- ---------------------------------------------------------------------------

create type app_rol as enum ('ADMIN', 'ARRENDADOR', 'ARRENDATARIO');

create type estado_contrato as enum (
  'BORRADOR', 'PENDIENTE_CONFIRMACION', 'CONFIRMADO', 'RECHAZADO',
  'CANCELADO', 'TERMINADO', 'VENCIDO'
);

create type estado_inmueble as enum ('DISPONIBLE', 'ARRENDADO', 'MANTENIMIENTO');

create type estado_pago as enum ('REPORTADO', 'VALIDADO', 'RECHAZADO');

create type estado_pago_servicio as enum (
  'PENDIENTE', 'REPORTADO', 'VALIDADO', 'RECHAZADO', 'VENCIDO'
);

create type estado_mantenimiento as enum (
  'ABIERTO', 'EN_GESTION', 'RESUELTO', 'CERRADO', 'RECHAZADO'
);

create type estado_no_renovacion as enum (
  'BORRADOR', 'PENDIENTE_GENERACION', 'DOCUMENTO_GENERADO',
  'ENVIO_REGISTRADO', 'ANULADA'
);

create type tipo_mantenimiento as enum (
  'LOCATIVO', 'ESTRUCTURAL', 'PREVENTIVO', 'CORRECTIVO', 'INSPECCION', 'ADMINISTRATIVO'
);

create type tipo_responsabilidad as enum (
  'ARRENDADOR', 'ARRENDATARIO', 'COMPARTIDO', 'POR_DEFINIR'
);

-- ---------------------------------------------------------------------------
-- USUARIOS Y ROLES
-- ---------------------------------------------------------------------------

create table if not exists usuarios (
  id text primary key default ('u-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  code text not null unique,
  nombre text not null,
  email text not null unique,
  rol app_rol not null default 'ARRENDATARIO',
  rol_activo app_rol not null default 'ARRENDATARIO',
  telefono text,
  tipo_documento text,
  numero_documento text,
  direccion_notificaciones text,
  correo_notificaciones text,
  activo boolean not null default true,
  perfil_completado boolean not null default false,
  firebase_uid text unique,
  creado_en date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists user_roles (
  id uuid primary key default gen_random_uuid(),
  usuario_id text not null references usuarios(id) on delete cascade,
  rol app_rol not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (usuario_id, rol)
);

-- Perfil vinculado a Firebase Auth (onboarding).
create table if not exists profiles (
  id text primary key,
  firebase_uid text not null unique,
  nombre text not null,
  email text not null unique,
  roles app_rol[] not null default '{}',
  rol_activo app_rol not null,
  telefono text,
  tipo_documento text,
  numero_documento text,
  direccion_notificaciones text,
  correo_notificaciones text,
  perfil_completado boolean not null default false,
  creado_en date not null default current_date,
  actualizado_en date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- INMUEBLES
-- ---------------------------------------------------------------------------

create table if not exists inmuebles (
  id text primary key default ('inm-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  code text not null unique,
  titulo text not null,
  direccion text not null,
  ciudad text not null default 'Bogotá D.C.',
  localidad text,
  barrio text,
  estrato smallint check (estrato between 1 and 6),
  tipo text not null,
  estado estado_inmueble not null default 'DISPONIBLE',
  canon_mensual numeric(14,2) not null,
  arrendador_id text not null references usuarios(id) on delete restrict,
  descripcion text,
  creado_en date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_inmuebles_arrendador on inmuebles(arrendador_id);
create index if not exists idx_inmuebles_localidad on inmuebles(localidad);
create index if not exists idx_inmuebles_estado on inmuebles(estado);

-- ---------------------------------------------------------------------------
-- CONTRATOS
-- ---------------------------------------------------------------------------

create table if not exists contratos (
  id text primary key default ('ctr-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  code text not null unique,
  inmueble_id text not null references inmuebles(id) on delete restrict,
  arrendatario_id text references usuarios(id) on delete set null,
  email_arrendatario text not null default '',
  nombre_arrendatario text,
  arrendador_id text not null references usuarios(id) on delete restrict,
  fecha_inicio date not null,
  fecha_fin date not null,
  canon_actual numeric(14,2) not null,
  canon_anterior numeric(14,2) not null default 0,
  porcentaje_reajuste numeric(6,2) not null default 0,
  fecha_ultimo_reajuste date,
  estado estado_contrato not null default 'BORRADOR',
  documento_url text,
  codeudor_nombre text,
  codeudor_documento text,
  codeudor_telefono text,
  codeudor_email text,
  deposito_garantia_valor numeric(14,2) not null default 0,
  deposito_garantia_estado text not null default 'PENDIENTE',
  prorroga_automatica boolean not null default false,
  fecha_limite_preaviso date not null,
  inventario_entrega text,
  observaciones_entrega text,
  motivo_rechazo text,
  no_renovar boolean not null default false,
  fecha_no_renovacion_registrada date,
  origen_no_renovacion text,
  no_renovacion_id text,
  creado_en date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_contratos_inmueble on contratos(inmueble_id);
create index if not exists idx_contratos_arrendador on contratos(arrendador_id);
create index if not exists idx_contratos_arrendatario on contratos(arrendatario_id);
create index if not exists idx_contratos_estado on contratos(estado);

create table if not exists invitaciones_contrato (
  id text primary key default ('inv-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  contrato_id text not null references contratos(id) on delete cascade,
  email_invitado text not null,
  nombre_invitado text,
  estado text not null default 'PENDIENTE',
  token_invitacion text not null unique,
  fecha_creacion timestamptz not null default now(),
  fecha_respuesta timestamptz,
  motivo_rechazo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- ARCHIVOS ADJUNTOS (Storage metadata)
-- ---------------------------------------------------------------------------

create table if not exists archivo_adjunto (
  id text primary key default ('adj-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  nombre text not null,
  tipo text,
  tamano bigint,
  bucket text,
  path text,
  public_url text,
  url_simulada text,
  descripcion text,
  uploaded_at timestamptz,
  uploaded_by text references usuarios(id) on delete set null,
  cargado_por_id text references usuarios(id) on delete set null,
  cargado_por_nombre text,
  cargado_por_email text,
  cargado_por_rol app_rol,
  fecha_carga timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_archivo_adjunto_bucket_path on archivo_adjunto(bucket, path);

create table if not exists contrato_documentos (
  id uuid primary key default gen_random_uuid(),
  contrato_id text not null references contratos(id) on delete cascade,
  archivo_id text not null references archivo_adjunto(id) on delete cascade,
  tipo_documento text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contrato_id, archivo_id)
);

-- ---------------------------------------------------------------------------
-- PAGOS (canon y servicios)
-- ---------------------------------------------------------------------------

create table if not exists pagos_canon (
  id text primary key default ('pag-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  code text not null unique,
  contrato_id text not null references contratos(id) on delete cascade,
  mes text not null,
  monto numeric(14,2) not null,
  fecha_reporte date not null,
  estado estado_pago not null default 'REPORTADO',
  comprobante_url text,
  notas text,
  medio_pago text,
  reportado_por_id text not null references usuarios(id) on delete restrict,
  fecha_validacion date,
  validado_por_id text references usuarios(id) on delete set null,
  rechazado_por_id text references usuarios(id) on delete set null,
  motivo_rechazo text,
  soporte_pago_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pagos_canon_contrato on pagos_canon(contrato_id);
create index if not exists idx_pagos_canon_estado on pagos_canon(estado);

create table if not exists soportes_pago (
  id text primary key default ('sop-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  pago_id text not null references pagos_canon(id) on delete cascade,
  contrato_id text not null references contratos(id) on delete cascade,
  arrendador_id text not null references usuarios(id) on delete restrict,
  arrendatario_id text not null references usuarios(id) on delete restrict,
  numero_soporte text not null unique,
  fecha_generacion timestamptz not null default now(),
  monto numeric(14,2) not null,
  periodo text not null,
  medio_pago text,
  observaciones text,
  estado_envio_email text not null default 'PENDIENTE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists servicios_publicos_contrato (
  id text primary key default ('spc-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  code text not null unique,
  contrato_id text not null references contratos(id) on delete cascade,
  inmueble_id text not null references inmuebles(id) on delete cascade,
  tipo_servicio text not null,
  empresa_prestadora text not null default '',
  numero_cuenta_servicio text not null default '',
  periodicidad text not null default 'MENSUAL',
  activo boolean not null default true,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_servicios_contrato on servicios_publicos_contrato(contrato_id);

create table if not exists pagos_servicios_publicos (
  id text primary key default ('psp-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  code text not null unique,
  servicio_publico_contrato_id text not null references servicios_publicos_contrato(id) on delete cascade,
  contrato_id text not null references contratos(id) on delete cascade,
  inmueble_id text not null references inmuebles(id) on delete cascade,
  periodo text not null,
  fecha_pago date not null,
  fecha_reporte date not null,
  fecha_vencimiento date not null,
  valor_pagado numeric(14,2) not null,
  estado estado_pago_servicio not null default 'PENDIENTE',
  comprobante_url text,
  reportado_por_id text not null references usuarios(id) on delete restrict,
  validado_por_id text references usuarios(id) on delete set null,
  fecha_validacion date,
  motivo_rechazo text,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pagos_servicio_contrato on pagos_servicios_publicos(contrato_id);

-- ---------------------------------------------------------------------------
-- MANTENIMIENTO
-- ---------------------------------------------------------------------------

create table if not exists mantenimientos (
  id text primary key default ('mnt-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  code text not null unique,
  inmueble_id text not null references inmuebles(id) on delete cascade,
  titulo text not null,
  descripcion text not null,
  prioridad text not null check (prioridad in ('BAJA', 'MEDIA', 'ALTA')),
  estado estado_mantenimiento not null default 'ABIERTO',
  tipo_mantenimiento tipo_mantenimiento,
  tipo_responsabilidad tipo_responsabilidad,
  valor_estimado numeric(14,2),
  valor_final numeric(14,2),
  porcentaje_arrendador numeric(5,2),
  porcentaje_arrendatario numeric(5,2),
  valor_arrendador numeric(14,2),
  valor_arrendatario numeric(14,2),
  fecha_estimada_atencion date,
  observaciones_responsabilidad text,
  observaciones_cierre text,
  aceptacion_arrendatario text,
  motivo_rechazo_responsabilidad text,
  solicitado_por_id text not null references usuarios(id) on delete restrict,
  asignado_a text,
  observaciones_gestion text,
  creado_en date not null default current_date,
  fecha_cierre date,
  adjunto_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_mantenimientos_inmueble on mantenimientos(inmueble_id);

create table if not exists mantenimiento_comentarios (
  id text primary key default ('cmn-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  mantenimiento_id text not null references mantenimientos(id) on delete cascade,
  contrato_id text references contratos(id) on delete set null,
  inmueble_id text not null references inmuebles(id) on delete cascade,
  usuario_id text not null references usuarios(id) on delete restrict,
  usuario_nombre text not null,
  usuario_email text not null,
  usuario_rol app_rol not null,
  comentario text not null,
  adjunto_url text,
  fecha_creacion timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists mantenimiento_documentos (
  id uuid primary key default gen_random_uuid(),
  mantenimiento_id text not null references mantenimientos(id) on delete cascade,
  archivo_id text not null references archivo_adjunto(id) on delete cascade,
  tipo_documento text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mantenimiento_id, archivo_id)
);

-- ---------------------------------------------------------------------------
-- NO RENOVACIÓN
-- ---------------------------------------------------------------------------

create table if not exists no_renovaciones (
  id text primary key default ('nr-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  code text not null unique,
  contrato_id text not null references contratos(id) on delete cascade,
  inmueble_id text not null references inmuebles(id) on delete cascade,
  datos jsonb not null default '{}',
  estado estado_no_renovacion not null default 'BORRADOR',
  motivo text,
  creado_en date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_no_renovaciones_contrato on no_renovaciones(contrato_id);

-- ---------------------------------------------------------------------------
-- NOTIFICACIONES
-- ---------------------------------------------------------------------------

create table if not exists notificaciones (
  id text primary key default ('ntf-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  tipo text not null,
  contrato_id text references contratos(id) on delete set null,
  destinatario_nombre text not null,
  destinatario_email text not null,
  rol_destinatario app_rol not null,
  asunto text not null,
  mensaje text not null,
  estado text not null default 'PENDIENTE',
  fecha_creacion timestamptz not null default now(),
  fecha_envio_simulado timestamptz,
  referencia_modulo text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- TRAZABILIDAD (auditoría)
-- ---------------------------------------------------------------------------

create table if not exists evento_trazabilidad (
  id text primary key default ('trz-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  entidad_tipo text not null,
  entidad_id text not null,
  contrato_id text references contratos(id) on delete set null,
  inmueble_id text references inmuebles(id) on delete set null,
  pago_id text references pagos_canon(id) on delete set null,
  usuario_afectado_id text references usuarios(id) on delete set null,
  accion text not null,
  estado_anterior text,
  estado_nuevo text,
  descripcion text not null,
  usuario_id text not null,
  usuario_nombre text not null,
  usuario_email text not null,
  usuario_rol text not null,
  fecha_hora timestamptz not null default now(),
  valores_anteriores jsonb,
  valores_nuevos jsonb,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_trz_entidad on evento_trazabilidad(entidad_tipo, entidad_id);
create index if not exists idx_trz_contrato on evento_trazabilidad(contrato_id);
create index if not exists idx_trz_inmueble on evento_trazabilidad(inmueble_id);
create index if not exists idx_trz_usuario on evento_trazabilidad(usuario_id);
create index if not exists idx_trz_fecha on evento_trazabilidad(fecha_hora desc);
create index if not exists idx_trz_accion on evento_trazabilidad(accion);

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Aplicar trigger a tablas principales (ejemplo; repetir según necesidad en migraciones)
do $$
declare t text;
begin
  foreach t in array array[
    'usuarios', 'inmuebles', 'contratos', 'pagos_canon', 'mantenimientos',
    'no_renovaciones', 'servicios_publicos_contrato', 'pagos_servicios_publicos'
  ] loop
    execute format('
      drop trigger if exists trg_%s_updated_at on %I;
      create trigger trg_%s_updated_at
        before update on %I
        for each row execute function set_updated_at();
    ', t, t, t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- RLS (políticas permisivas demo — ver docs/database/rls-strategy.md)
-- Supabase habilita RLS por defecto; sin política = todo bloqueado (42501).
-- Si ya ejecutó el schema antes, corra también: supabase-rls-demo.sql
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;
alter table usuarios enable row level security;
alter table user_roles enable row level security;
alter table inmuebles enable row level security;
alter table contratos enable row level security;
alter table invitaciones_contrato enable row level security;
alter table pagos_canon enable row level security;
alter table soportes_pago enable row level security;
alter table servicios_publicos_contrato enable row level security;
alter table pagos_servicios_publicos enable row level security;
alter table mantenimientos enable row level security;
alter table mantenimiento_comentarios enable row level security;
alter table mantenimiento_documentos enable row level security;
alter table no_renovaciones enable row level security;
alter table notificaciones enable row level security;
alter table evento_trazabilidad enable row level security;
alter table archivo_adjunto enable row level security;
alter table contrato_documentos enable row level security;

create policy "mvp_demo_profiles" on profiles for all using (true) with check (true);
create policy "mvp_demo_usuarios" on usuarios for all using (true) with check (true);
create policy "mvp_demo_user_roles" on user_roles for all using (true) with check (true);
create policy "mvp_demo_inmuebles" on inmuebles for all using (true) with check (true);
create policy "mvp_demo_contratos" on contratos for all using (true) with check (true);
create policy "mvp_demo_invitaciones" on invitaciones_contrato for all using (true) with check (true);
create policy "mvp_demo_pagos_canon" on pagos_canon for all using (true) with check (true);
create policy "mvp_demo_soportes_pago" on soportes_pago for all using (true) with check (true);
create policy "mvp_demo_servicios_contrato" on servicios_publicos_contrato for all using (true) with check (true);
create policy "mvp_demo_pagos_servicio" on pagos_servicios_publicos for all using (true) with check (true);
create policy "mvp_demo_mantenimientos" on mantenimientos for all using (true) with check (true);
create policy "mvp_demo_mnt_comentarios" on mantenimiento_comentarios for all using (true) with check (true);
create policy "mvp_demo_mnt_documentos" on mantenimiento_documentos for all using (true) with check (true);
create policy "mvp_demo_no_renovaciones" on no_renovaciones for all using (true) with check (true);
create policy "mvp_demo_notificaciones" on notificaciones for all using (true) with check (true);
create policy "mvp_demo_trazabilidad" on evento_trazabilidad for all using (true) with check (true);
create policy "mvp_demo_archivo_adjunto" on archivo_adjunto for all using (true) with check (true);
create policy "mvp_demo_contrato_docs" on contrato_documentos for all using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Storage buckets (crear en Dashboard > Storage o vía API):
-- contratos | pagos | servicios | mantenimiento | no-renovacion | evidencias
-- ---------------------------------------------------------------------------

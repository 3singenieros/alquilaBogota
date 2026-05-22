-- Esquema MVP — Gestión de Arrendamientos
-- Ejecutar en SQL Editor de Supabase

create extension if not exists "pgcrypto";

-- USUARIOS (perfil demo; auth.users se vincula en fase posterior)
create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  nombre text not null,
  email text not null unique,
  rol text not null check (rol in ('ADMIN', 'ARRENDADOR', 'ARRENDATARIO')),
  telefono text,
  activo boolean not null default true,
  creado_en date not null default current_date
);

create table if not exists inmuebles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  titulo text not null,
  direccion text not null,
  ciudad text not null,
  tipo text not null,
  estado text not null check (estado in ('DISPONIBLE', 'ARRENDADO', 'MANTENIMIENTO')),
  canon_mensual numeric not null,
  arrendador_id uuid references usuarios(id),
  descripcion text,
  creado_en date not null default current_date
);

create table if not exists contratos (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  inmueble_id uuid not null references inmuebles(id) on delete cascade,
  arrendatario_id uuid not null references usuarios(id),
  arrendador_id uuid not null references usuarios(id),
  fecha_inicio date not null,
  fecha_fin date not null,
  canon_mensual numeric not null,
  estado text not null check (estado in ('ACTIVO', 'VENCIDO', 'PENDIENTE', 'TERMINADO')),
  documento_url text,
  creado_en date not null default current_date
);

create table if not exists pagos_reportados (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  contrato_id uuid not null references contratos(id) on delete cascade,
  mes text not null,
  monto numeric not null,
  fecha_reporte date not null,
  estado text not null check (estado in ('REPORTADO', 'VALIDADO', 'RECHAZADO')),
  comprobante_url text,
  notas text,
  reportado_por_id uuid not null references usuarios(id)
);

create table if not exists servicios_publicos (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  inmueble_id uuid not null references inmuebles(id) on delete cascade,
  tipo text not null,
  periodo text not null,
  monto numeric not null,
  vencimiento date not null,
  estado text not null check (estado in ('PENDIENTE', 'PAGADO', 'VENCIDO')),
  comprobante_url text
);

create table if not exists mantenimiento (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  inmueble_id uuid not null references inmuebles(id) on delete cascade,
  titulo text not null,
  descripcion text not null,
  prioridad text not null check (prioridad in ('BAJA', 'MEDIA', 'ALTA')),
  estado text not null check (estado in ('ABIERTO', 'EN_PROGRESO', 'RESUELTO', 'CERRADO')),
  solicitado_por_id uuid not null references usuarios(id),
  asignado_a text,
  creado_en date not null default current_date,
  adjunto_url text
);

create table if not exists no_renovacion (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  contrato_id uuid not null references contratos(id) on delete cascade,
  motivo text not null,
  fecha_solicitud date not null,
  estado text not null check (estado in ('SOLICITADA', 'EN_REVISION', 'ACEPTADA', 'RECHAZADA')),
  documento_url text,
  solicitado_por_id uuid not null references usuarios(id)
);

-- RLS permisivo para demo académico (ajustar en producción)
alter table usuarios enable row level security;
alter table inmuebles enable row level security;
alter table contratos enable row level security;
alter table pagos_reportados enable row level security;
alter table servicios_publicos enable row level security;
alter table mantenimiento enable row level security;
alter table no_renovacion enable row level security;

create policy "demo_all_usuarios" on usuarios for all using (true) with check (true);
create policy "demo_all_inmuebles" on inmuebles for all using (true) with check (true);
create policy "demo_all_contratos" on contratos for all using (true) with check (true);
create policy "demo_all_pagos" on pagos_reportados for all using (true) with check (true);
create policy "demo_all_servicios" on servicios_publicos for all using (true) with check (true);
create policy "demo_all_mantenimiento" on mantenimiento for all using (true) with check (true);
create policy "demo_all_no_renovacion" on no_renovacion for all using (true) with check (true);

-- Storage buckets (crear en Dashboard > Storage):
-- comprobantes, contratos, mantenimiento, documentos

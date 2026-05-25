-- =============================================================================
-- Supabase Storage — buckets y políticas demo (MVP académico)
-- Ejecutar en SQL Editor después de supabase-schema.sql
-- =============================================================================

insert into storage.buckets (id, name, public)
values
  ('contratos', 'contratos', false),
  ('pagos', 'pagos', false),
  ('servicios', 'servicios', false),
  ('mantenimiento', 'mantenimiento', false),
  ('no-renovacion', 'no-renovacion', false),
  ('evidencias', 'evidencias', false)
on conflict (id) do update set public = excluded.public;

-- Políticas permisivas demo (anon key desde Next.js)
drop policy if exists "mvp_storage_objects_all" on storage.objects;
create policy "mvp_storage_objects_all"
  on storage.objects for all
  using (bucket_id in ('contratos','pagos','servicios','mantenimiento','no-renovacion','evidencias'))
  with check (bucket_id in ('contratos','pagos','servicios','mantenimiento','no-renovacion','evidencias'));

-- Columnas de entidad en archivo_adjunto (idempotente)
alter table if exists archivo_adjunto add column if not exists entidad_tipo text;
alter table if exists archivo_adjunto add column if not exists entidad_id text;
alter table if exists archivo_adjunto add column if not exists contrato_id text references contratos(id) on delete set null;
alter table if exists archivo_adjunto add column if not exists inmueble_id text references inmuebles(id) on delete set null;

create index if not exists idx_archivo_adjunto_entidad on archivo_adjunto(entidad_tipo, entidad_id);

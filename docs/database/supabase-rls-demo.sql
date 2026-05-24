-- =============================================================================
-- RLS permisivo para MVP demo (Firebase Auth + anon key desde Next.js)
-- Ejecutar en SQL Editor si aparece error 42501 en profiles u otras tablas.
-- =============================================================================

-- profiles (crítico al login / onboarding)
alter table if exists profiles enable row level security;
drop policy if exists "mvp_demo_profiles" on profiles;
create policy "mvp_demo_profiles" on profiles for all using (true) with check (true);

-- usuarios y roles
alter table if exists usuarios enable row level security;
drop policy if exists "mvp_demo_usuarios" on usuarios;
create policy "mvp_demo_usuarios" on usuarios for all using (true) with check (true);

alter table if exists user_roles enable row level security;
drop policy if exists "mvp_demo_user_roles" on user_roles;
create policy "mvp_demo_user_roles" on user_roles for all using (true) with check (true);

-- inmuebles y contratos
alter table if exists inmuebles enable row level security;
drop policy if exists "mvp_demo_inmuebles" on inmuebles;
create policy "mvp_demo_inmuebles" on inmuebles for all using (true) with check (true);

alter table if exists contratos enable row level security;
drop policy if exists "mvp_demo_contratos" on contratos;
create policy "mvp_demo_contratos" on contratos for all using (true) with check (true);

alter table if exists invitaciones_contrato enable row level security;
drop policy if exists "mvp_demo_invitaciones" on invitaciones_contrato;
create policy "mvp_demo_invitaciones" on invitaciones_contrato for all using (true) with check (true);

-- pagos
alter table if exists pagos_canon enable row level security;
drop policy if exists "mvp_demo_pagos_canon" on pagos_canon;
create policy "mvp_demo_pagos_canon" on pagos_canon for all using (true) with check (true);

alter table if exists soportes_pago enable row level security;
drop policy if exists "mvp_demo_soportes_pago" on soportes_pago;
create policy "mvp_demo_soportes_pago" on soportes_pago for all using (true) with check (true);

alter table if exists servicios_publicos_contrato enable row level security;
drop policy if exists "mvp_demo_servicios_contrato" on servicios_publicos_contrato;
create policy "mvp_demo_servicios_contrato" on servicios_publicos_contrato for all using (true) with check (true);

alter table if exists pagos_servicios_publicos enable row level security;
drop policy if exists "mvp_demo_pagos_servicio" on pagos_servicios_publicos;
create policy "mvp_demo_pagos_servicio" on pagos_servicios_publicos for all using (true) with check (true);

-- mantenimiento
alter table if exists mantenimientos enable row level security;
drop policy if exists "mvp_demo_mantenimientos" on mantenimientos;
create policy "mvp_demo_mantenimientos" on mantenimientos for all using (true) with check (true);

alter table if exists mantenimiento_comentarios enable row level security;
drop policy if exists "mvp_demo_mnt_comentarios" on mantenimiento_comentarios;
create policy "mvp_demo_mnt_comentarios" on mantenimiento_comentarios for all using (true) with check (true);

alter table if exists mantenimiento_documentos enable row level security;
drop policy if exists "mvp_demo_mnt_documentos" on mantenimiento_documentos;
create policy "mvp_demo_mnt_documentos" on mantenimiento_documentos for all using (true) with check (true);

-- no renovación y notificaciones
alter table if exists no_renovaciones enable row level security;
drop policy if exists "mvp_demo_no_renovaciones" on no_renovaciones;
create policy "mvp_demo_no_renovaciones" on no_renovaciones for all using (true) with check (true);

alter table if exists notificaciones enable row level security;
drop policy if exists "mvp_demo_notificaciones" on notificaciones;
create policy "mvp_demo_notificaciones" on notificaciones for all using (true) with check (true);

-- trazabilidad y archivos
alter table if exists evento_trazabilidad enable row level security;
drop policy if exists "mvp_demo_trazabilidad" on evento_trazabilidad;
create policy "mvp_demo_trazabilidad" on evento_trazabilidad for all using (true) with check (true);

alter table if exists archivo_adjunto enable row level security;
drop policy if exists "mvp_demo_archivo_adjunto" on archivo_adjunto;
create policy "mvp_demo_archivo_adjunto" on archivo_adjunto for all using (true) with check (true);

alter table if exists contrato_documentos enable row level security;
drop policy if exists "mvp_demo_contrato_docs" on contrato_documentos;
create policy "mvp_demo_contrato_docs" on contrato_documentos for all using (true) with check (true);

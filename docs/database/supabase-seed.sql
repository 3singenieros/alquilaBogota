-- Seed demo — ejecutar después de supabase-schema.sql
-- Alineado con data/mock/seed.ts (IDs fijos para pruebas E2E)

-- Usuarios
insert into usuarios (
  id, code, nombre, email, rol, rol_activo, telefono, activo, perfil_completado, creado_en
) values
  ('u-admin', 'u-admin', 'Ana Administradora', 'admin@demo.edu', 'ADMIN', 'ADMIN', '3001110001', true, true, '2025-01-10'),
  ('u-arrendador', 'u-arrendador', 'Carlos Arrendador', 'arrendador@demo.edu', 'ARRENDADOR', 'ARRENDADOR', '3001110002', true, true, '2025-01-10'),
  ('u-arrendatario', 'u-arrendatario', 'María Arrendataria', 'arrendatario@demo.edu', 'ARRENDATARIO', 'ARRENDATARIO', '3001110003', true, true, '2025-02-01')
on conflict (id) do nothing;

insert into user_roles (usuario_id, rol) values
  ('u-admin', 'ADMIN'),
  ('u-arrendador', 'ARRENDADOR'),
  ('u-arrendatario', 'ARRENDATARIO')
on conflict (usuario_id, rol) do nothing;

-- Inmuebles (Bogotá D.C.)
insert into inmuebles (
  id, code, titulo, direccion, ciudad, localidad, barrio, estrato, tipo, estado,
  canon_mensual, arrendador_id, descripcion, creado_en
) values
  (
    'inm-1', 'inm-1', 'Apartamento Centro', 'Calle 45 #12-30', 'Bogotá D.C.',
    'Chapinero', 'Quinta Camacho', 5, 'Apartamento', 'ARRENDADO',
    1800000, 'u-arrendador', '2 habitaciones, balcón', '2025-01-15'
  ),
  (
    'inm-2', 'inm-2', 'Local Comercial Norte', 'Av. 68 #25-10', 'Bogotá D.C.',
    'Barrios Unidos', 'Santa Lucía', 4, 'Local', 'ARRENDADO',
    3200000, 'u-arrendador', null, '2025-02-01'
  )
on conflict (id) do nothing;

-- Contrato demo
insert into contratos (
  id, code, inmueble_id, arrendatario_id, email_arrendatario, nombre_arrendatario,
  arrendador_id, fecha_inicio, fecha_fin, canon_actual, canon_anterior,
  porcentaje_reajuste, estado, deposito_garantia_valor, deposito_garantia_estado,
  prorroga_automatica, fecha_limite_preaviso, inventario_entrega, creado_en
) values (
  'ctr-1', 'ctr-1', 'inm-1', 'u-arrendatario', 'arrendatario@demo.edu', 'María Arrendataria',
  'u-arrendador', '2025-02-01', '2027-01-31', 1800000, 0,
  0, 'CONFIRMADO', 3600000, 'PENDIENTE',
  false, '2026-10-31', 'Nevera, estufa, 6 sillas comedor, cortinas sala', '2025-01-28'
)
on conflict (id) do nothing;

-- Trazabilidad demo
insert into evento_trazabilidad (
  id, entidad_tipo, entidad_id, contrato_id, inmueble_id, accion, descripcion,
  usuario_id, usuario_nombre, usuario_email, usuario_rol, fecha_hora
) values (
  'trz-seed-1', 'CONTRATO', 'ctr-1', 'ctr-1', 'inm-1', 'CREADO',
  'Contrato ctr-1 creado (seed Supabase)',
  'u-arrendador', 'Carlos Arrendador', 'arrendador@demo.edu', 'ARRENDADOR',
  now() - interval '1 day'
)
on conflict (id) do nothing;

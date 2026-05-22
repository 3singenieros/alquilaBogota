-- Seed demo (ejecutar después de schema.sql)
-- Nota: IDs fijos requieren usar uuid o text; para demo usamos insert sin id fijo
-- y se recomienda alinear con data/mock/seed.ts tras primera carga manual.

insert into usuarios (id, nombre, email, rol, telefono, activo, creado_en) values
  ('00000000-0000-0000-0000-000000000001', 'Ana Administradora', 'admin@demo.edu', 'ADMIN', '3001110001', true, '2025-01-10'),
  ('00000000-0000-0000-0000-000000000002', 'Carlos Arrendador', 'arrendador@demo.edu', 'ARRENDADOR', '3001110002', true, '2025-01-10'),
  ('00000000-0000-0000-0000-000000000003', 'María Arrendataria', 'arrendatario@demo.edu', 'ARRENDATARIO', '3001110003', true, '2025-02-01')
on conflict (id) do nothing;

-- Completar inmuebles, contratos y demás entidades según tu proyecto Supabase
-- Ver data/mock/seed.ts como referencia de valores de negocio.

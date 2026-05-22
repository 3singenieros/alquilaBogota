# Gestión de Arrendamientos — MVP Académico

Prototipo para tesis de Ingeniería de Software. Gestiona **arrendamientos ya activos** (no marketplace).

## Stack

- Next.js App Router + TypeScript + Tailwind
- Capa de datos preparada para **Supabase** (PostgreSQL + Storage + Auth futuro)
- Modo demo con **datos mock** en memoria

## Inicio rápido

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Cambia el rol demo desde el selector del topbar (ADMIN / ARRENDADOR / ARRENDATARIO).

## Estructura

| Carpeta | Responsabilidad |
|---------|-----------------|
| `app/(dashboard)/` | Rutas y Server Actions |
| `components/` | UI y módulos visuales |
| `services/` | Lógica de negocio |
| `repositories/` | Acceso mock o Supabase |
| `types/` | Modelos TypeScript |
| `data/mock/` | Seed estático |
| `supabase/` | SQL schema y seed |

## Conectar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ejecuta `supabase/schema.sql` en el SQL Editor.
3. Crea buckets: `comprobantes`, `contratos`, `mantenimiento`, `documentos`.
4. Copia `.env.example` → `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_USE_MOCK_DATA=false
```

5. Opcional: `supabase/seed.sql` para datos iniciales.

## Reglas del proyecto

Ver `.cursor/rules/` — prioridad MVP, sin pagos reales, sin firma digital, capas separadas.

## Documentación

- [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md)

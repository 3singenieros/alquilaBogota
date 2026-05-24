# Modelo relacional — AlquilaBogotá MVP

Esquema PostgreSQL alineado con `types/index.ts`, `types/trazabilidad.ts` y `types/profile.ts`.

## Principios

- **IDs tipo `text`**: compatibles con seeds mock (`u-arrendador`, `inm-1`, `ctr-1`) para migración incremental.
- **Campo `code`**: identificador de negocio único en cada entidad principal.
- **`created_at` / `updated_at`**: auditoría técnica; `creado_en` conserva semántica de dominio.
- **Soft delete opcional**: `deleted_at` en usuarios, inmuebles y contratos.
- **JSONB**: expedientes complejos (no renovación, trazabilidad) sin romper el modelo tipado en TypeScript.

## Tablas principales

| Tabla | Entidad TypeScript | Fase migración |
|-------|-------------------|----------------|
| `usuarios` | `Usuario` | 1 |
| `user_roles` | `Usuario.roles[]` | 1 |
| `profiles` | `UserProfile` (Firebase) | 1 |
| `inmuebles` | `Inmueble` | 1 |
| `contratos` | `Contrato` | 1 |
| `contrato_documentos` | `Contrato.documentosAdjuntos` | 2 |
| `invitaciones_contrato` | `InvitacionContrato` | 2 |
| `pagos_canon` | `PagoReportado` | 2 |
| `soportes_pago` | `SoportePago` | 2 |
| `servicios_publicos_contrato` | `ServicioPublicoContrato` | 2 |
| `pagos_servicios_publicos` | `PagoServicioPublico` | 2 |
| `mantenimientos` | `Mantenimiento` | 2 |
| `mantenimiento_comentarios` | `ComentarioMantenimiento` | 2 |
| `mantenimiento_documentos` | evidencias/cierre | 2 |
| `no_renovaciones` | `NoRenovacion` | 2 |
| `notificaciones` | `Notificacion` | 2 |
| `evento_trazabilidad` | `EventoTrazabilidad` | 1 |
| `archivo_adjunto` | `ArchivoAdjunto` | 2 |

## ENUMs PostgreSQL

Definidos en `supabase-schema.sql` y reflejados en `lib/supabase/types.ts`:

- `app_rol`, `estado_contrato`, `estado_inmueble`, `estado_pago`
- `estado_pago_servicio`, `estado_mantenimiento`, `estado_no_renovacion`
- `tipo_mantenimiento`, `tipo_responsabilidad`

Las acciones de trazabilidad (`AccionTrazabilidad`) se almacenan como `text` por su extensibilidad.

## Firebase Auth vs Supabase DB

| Responsabilidad | Tecnología |
|-----------------|------------|
| Autenticación (login, tokens) | **Firebase Auth** |
| Perfil de onboarding | `profiles` en Supabase |
| Datos de negocio | PostgreSQL Supabase |
| Archivos | Supabase Storage + `archivo_adjunto` |

Firebase provee identidad; Supabase persiste el dominio. El vínculo es `profiles.firebase_uid` / `usuarios.firebase_uid`.

## Script SQL

Ejecutar `docs/database/supabase-schema.sql` en el SQL Editor de Supabase.
Seed demo: `docs/database/supabase-seed.sql`.

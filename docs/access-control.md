# Control de acceso (MVP mock)

Las reglas de visibilidad por rol y relación contractual están centralizadas en `services/access-control.service.ts` y se aplican en los servicios (no solo en la UI).

## Reglas resumidas

| Rol | Alcance |
|-----|---------|
| **ADMIN** | Todo |
| **ARRENDADOR** | Inmuebles/contratos donde `arrendadorId` = usuario; datos derivados (pagos, servicios, mantenimiento, NR, trazabilidad, notificaciones propias o de sus contratos) |
| **ARRENDATARIO** | Contratos donde es arrendatario o el email coincide; invitaciones al email; datos de esos contratos; eventos personales sin `contratoId`/`inmuebleId` solo si son del propio usuario/email |
| **Sin vínculos** | Dashboard vacío, perfil, onboarding; notificaciones solo al email exacto |

## Roles múltiples

- El perfil guarda `roles[]` y `rolActivo`.
- Onboarding inicial: el usuario elige uno o ambos roles (ARRENDADOR / ARRENDATARIO).
- Después puede **agregar roles** desde `/perfil` o el selector del topbar, sin repetir onboarding.
- La navegación y el control de acceso usan **`rolActivo`** (`rolEfectivo()` en servicios).
- ADMIN no se asigna desde la UI.

## Trazabilidad

Eventos sin `contratoId` ni `inmuebleId` solo son visibles si `usuarioId`, `usuarioEmail` o `metadata.destinatarioEmail` corresponden al usuario actual.

## Base de datos real

Cuando se conecte Supabase/PostgreSQL, estas reglas deberán reforzarse con **Row Level Security** o validaciones del backend; el filtrado en servicios del MVP no sustituye políticas en la base de datos.

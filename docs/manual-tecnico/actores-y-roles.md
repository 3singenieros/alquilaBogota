# Actores y roles

## Roles del sistema

El enum `Rol` en `types/index.ts` define: `ADMIN`, `ARRENDADOR`, `ARRENDATARIO`.

### Administrador (ADMIN)

| Aspecto | Detalle |
|---------|---------|
| **Descripción** | Superusuario del prototipo con visión global del arrendamiento gestionado en la plataforma. |
| **Permisos** | Crear, editar y eliminar en todos los módulos accesibles; gestión de usuarios; sin restricción por `arrendadorId` / contrato. |
| **Módulos visibles** | Dashboard, Inmuebles, Contratos, Pagos, Servicios, Mantenimiento, No renovación, Notificaciones, Solicitudes contrato, Usuarios y roles, Trazabilidad, Reportes, Perfil. |
| **Restricciones** | No se asigna desde la UI de perfil (solo datos seed o configuración). Debe completar onboarding si aplica perfil Firebase. |
| **Acciones principales** | Revisar operación completa, auditar trazabilidad, administrar usuarios de referencia, validar módulos en demo académica. |

### Arrendador (ARRENDADOR)

| Aspecto | Detalle |
|---------|---------|
| **Descripción** | Propietario o gestor de inmuebles que administra contratos, valida pagos y servicios, y gestiona mantenimiento y no renovación. |
| **Permisos** | CRUD inmuebles propios; CRUD contratos vinculados; validar/rechazar pagos de canon y servicios; configurar servicios públicos del contrato; gestionar mantenimiento; iniciar no renovación; generar reportes. |
| **Módulos visibles** | Dashboard, Inmuebles, Contratos, Pagos, Servicios, Mantenimiento, No renovación, Notificaciones, Trazabilidad, Reportes, Perfil. **No** ve Solicitudes contrato ni Usuarios (salvo rol activo distinto). |
| **Restricciones** | Solo datos donde `inmueble.arrendadorId` o `contrato.arrendadorId` coincide con su usuario; no elimina expedientes de no renovación (`canDelete` false). |
| **Acciones principales** | Publicar inmueble, crear contrato e invitar, validar comprobantes, cerrar tickets de mantenimiento, generar PDF de no renovación y reportes. |

### Arrendatario (ARRENDATARIO)

| Aspecto | Detalle |
|---------|---------|
| **Descripción** | Ocupante del inmueble bajo contrato confirmado; reporta pagos y participa en mantenimiento y no renovación. |
| **Permisos** | Crear pagos reportados y solicitudes de mantenimiento; editar solicitudes de contrato (aceptar/rechazar); crear expedientes de no renovación según reglas; consultar reportes de sus contratos. |
| **Módulos visibles** | Dashboard, Pagos, Servicios, Mantenimiento, No renovación, Notificaciones, **Solicitudes contrato** (etiqueta “Mis contratos / Solicitudes”), Reportes, Perfil. |
| **Restricciones** | Sin inmuebles ni contratos en menú si solo es arrendatario; si **no tiene contratos ni invitaciones pendientes**, se ocultan Pagos, Servicios, Mantenimiento, No renovación y Reportes (`sidebar.tsx` + `getNavAccessSummary`). No accede a Trazabilidad ni Usuarios. |
| **Acciones principales** | Aceptar/rechazar invitación, reportar canon y servicios con comprobante, comentar mantenimiento, aceptar responsabilidad compartida. |

## Roles múltiples y rol activo

> **Nota:** Un mismo usuario puede tener más de un rol (`Usuario.roles[]` y tabla `user_roles` / array `profiles.roles`). El sistema opera con un **rol activo** (`rolActivo` / `rol_activo`) que determina navegación, permisos de módulo (`lib/auth/permissions.ts`) y filtrado de datos (`rolEfectivo()` en servicios).

Flujo implementado:

1. **Onboarding** (`/onboarding`): el usuario elige uno o ambos roles operativos (ARRENDADOR / ARRENDATARIO).
2. **Perfil** (`/perfil`) y **topbar**: puede agregar roles adicionales (`add-role-modal.tsx`) y cambiar el rol activo sin repetir onboarding.
3. **Middleware**: usa `payload.rolActivo` con `canAccessPath()` para autorizar rutas.

La sincronización entre Firebase (`profiles`) y dominio (`usuarios`) se realiza en `services/usuario-sync.service.ts`.

## Matriz rápida módulo ↔ rol

| Módulo / Ruta | ADMIN | ARRENDADOR | ARRENDATARIO |
|---------------|:-----:|:----------:|:------------:|
| Dashboard | ✓ | ✓ | ✓ |
| Inmuebles | ✓ | ✓ | — |
| Contratos | ✓ | ✓ | —* |
| Solicitudes contrato | ✓ | — | ✓ |
| Pagos | ✓ | ✓ | ✓** |
| Servicios | ✓ | ✓ | ✓** |
| Mantenimiento | ✓ | ✓ | ✓** |
| No renovación | ✓ | ✓ | ✓** |
| Notificaciones | ✓ | ✓ | ✓ |
| Usuarios | ✓ | — | — |
| Trazabilidad | ✓ | ✓ | — |
| Reportes | ✓ | ✓ | ✓** |
| Perfil | ✓ | ✓ | ✓ |

\* Arrendatario puro no ve menú Contratos; gestiona vínculo vía Solicitudes.  
\** Oculto si arrendatario sin contratos ni invitaciones pendientes.

## Referencias

- `docs/access-control.md`
- `services/access-control.service.ts`
- `lib/auth/permissions.ts`

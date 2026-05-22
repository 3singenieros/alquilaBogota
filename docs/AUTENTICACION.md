# Autenticación y autorización (MVP)

## Resumen

El acceso al sistema exige **inicio de sesión** con usuario y contraseña. Las credenciales son de **demostración** (mapa local en código); la sesión se guarda en una **cookie httpOnly** firmada. Los datos listados y las mutaciones se filtran por **rol** en la capa de servicios.

## Credenciales demo

| Usuario | Contraseña | Rol en sistema | Perfil seed |
|---------|------------|----------------|-------------|
| `admin` | `admin123` | ADMIN | Ana Administradora |
| `arrendador` | `arrendador123` | ARRENDADOR | Carlos Arrendador |
| `arrendatario` | `arrendatario123` | ARRENDATARIO | María Arrendataria |

Definidas en `lib/auth/mock-credentials.ts`. No usar en producción.

## Flujo de sesión

1. `POST` implícito vía Server Action `loginAction` en `/login`.
2. `auth.service.login` valida credenciales y carga el `Usuario` del repositorio mock.
3. Se emite cookie `alquila_session` (payload firmado: `userId`, `rol`, `exp`).
4. `middleware.ts` verifica la cookie en cada ruta excepto `/login` y assets estáticos.
5. `logoutAction` elimina la cookie y redirige a `/login`.

Variable obligatoria en local: `SESSION_SECRET` (ver `.env.example`).

## Rutas por rol

| Ruta | ADMIN | ARRENDADOR | ARRENDATARIO |
|------|:-----:|:----------:|:------------:|
| `/` | Sí | Sí | Sí |
| `/inmuebles` | Sí | Sí | No |
| `/contratos` | Sí | Sí | No |
| `/pagos` | Sí | Sí | Sí |
| `/servicios` | Sí | Sí | No |
| `/mantenimiento` | Sí | Sí | Sí |
| `/no-renovacion` | Sí | Sí | Sí |
| `/usuarios` | Sí | No | No |

Ruta no permitida → redirección a `/sin-acceso`.

Configuración central: `lib/auth/permissions.ts` (`NAV_ITEMS`, `canAccessPath`, `getModulePermissions`).

## Filtrado de datos

En `lib/auth/scopes.ts` y en cada `services/*.service.ts`:

- **ARRENDADOR**: inmuebles y contratos donde `arrendadorId` coincide con su `id`.
- **ARRENDATARIO**: contratos donde `arrendatarioId` coincide; pagos y no renovación ligados a esos contratos; mantenimiento que él solicitó o de su inmueble arrendado.
- **ADMIN**: sin filtro.

Funciones de referencia sin abrir el módulo Contratos: `listarContratosReferencia`, `listarInmueblesReferencia`.

## Capas

```
/login (público)
  → auth.service.login
  → cookie

middleware → verifySessionToken + canAccessPath

(dashboard)/layout → requireSession → AppShell(usuario)

page → service (requireSession + assertModuleAccess + scopes)
  → repository
```

## Evolución a Supabase Auth

1. Sustituir `login` por `signInWithPassword`.
2. Mantener tabla `usuarios` como perfil (`auth.users` ↔ `usuarios.id`).
3. Reutilizar `permissions.ts` y filtros en servicios; añadir RLS en PostgreSQL.
4. Cookie de sesión puede reemplazarse por la sesión del cliente Supabase SSR.

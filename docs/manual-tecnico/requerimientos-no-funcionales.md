# Requerimientos no funcionales — AlquilaBogotá MVP

Requerimientos derivados de decisiones de arquitectura, stack y código existente. Cada ítem indica el componente que materializa el criterio en esta versión.

| Código | Tipo | Descripción | Criterio de cumplimiento | Componente que lo soporta |
|--------|------|-------------|--------------------------|---------------------------|
| **RNF-01** | Seguridad | Autenticación obligatoria en rutas del dashboard; sesión en cookie firmada; validación de permisos por ruta y por recurso contractual. | Sin cookie válida → `/login`; ruta no permitida → `/sin-acceso`; acceso a contrato ajeno lanza `FORBIDDEN` y puede registrar `ACCESO_DENEGADO`. | `middleware.ts`, `lib/auth/session-token.ts`, `services/auth.service.ts`, `services/access-control.service.ts` |
| **RNF-02** | Usabilidad | Interfaz tipo SaaS con sidebar, tablas filtrables, badges de estado y modales CRUD. | Navegación por rol; `data-testid` en páginas y menú; feedback visual de estados. | `components/layout/`, `components/ui/`, módulos en `components/modules/` |
| **RNF-03** | Rendimiento | Monolito Next.js sin microservicios; listados vía Server Components; una instancia de worker en E2E. | Tiempos de carga aceptables en local; pruebas E2E timeout 90s global / 20s evidencias. | Next.js App Router, `playwright.config.ts` |
| **RNF-04** | Disponibilidad | Dependencia de servicios externos (Firebase, Supabase, hosting). | App funciona offline de datos solo en modo MOCK local; producción requiere disponibilidad de proveedores. | `config/app-mode.ts`, despliegue Vercel/Node documentado en arquitectura |
| **RNF-05** | Escalabilidad | Separación en capas services/repositories permite cambiar persistencia sin reescribir UI. | Nuevo backend = nuevos repositorios Supabase; UI consume mismos servicios. | `repositories/index.ts`, `repositories/supabase/` |
| **RNF-06** | Mantenibilidad | Tipos centralizados, enums alineados con SQL, trazas de auditoría unificadas. | Cambio de estado documentado en `types/index.ts` y `supabase-schema.sql`; eventos vía `trace-helper`. | `types/`, `lib/audit/`, `docs/database/` |
| **RNF-07** | Portabilidad | Aplicación Node.js estándar; variables de entorno para modo y credenciales. | Ejecutable con `npm run dev` / `npm run build` en Windows/Linux/macOS. | `package.json`, `.env.example` |
| **RNF-08** | Compatibilidad | Cliente web moderno; pruebas en Chromium (Playwright). | E2E pasa en Desktop Chrome profile; UI responsive con sidebar colapsable. | `playwright.config.ts`, Tailwind CSS |
| **RNF-09** | Trazabilidad | Registro de acciones de negocio y adjuntos en bitácora inmutable (append). | Toda operación crítica invoca `getTrazabilidadRepository().create` o helpers `trace*`. | `services/trazabilidad.service.ts`, `evento_trazabilidad` |
| **RNF-10** | Integridad de datos | FK en PostgreSQL; reglas de negocio (un contrato activo por inmueble, estados válidos). | Violación lanza `BusinessRuleError`; transiciones coherentes en servicios. | `services/contratos.service.ts`, `docs/database/supabase-schema.sql` |
| **RNF-11** | Almacenamiento documental | Archivos en buckets Supabase; metadatos en `archivo_adjunto` y tablas puente. | Upload con path estándar; lectura hidratada en repositorios Supabase. | `services/file-storage.service.ts`, `lib/supabase/storage-paths.ts`, buckets en `supabase-storage-setup.sql` |
| **RNF-12** | Auditoría | Eventos con actor (id, nombre, email, rol), estados anterior/nuevo y metadata JSON. | Consulta filtrada en `/trazabilidad` y reportes; accesos denegados auditados. | `types/trazabilidad.ts`, `lib/audit/actor.ts` |
| **RNF-13** | Respaldo/recuperación | **Implementación parcial:** responsabilidad de backups en Supabase/Firebase (proveedor). | Documentar que el MVP no incluye DR propio; seed SQL permite reinstalar datos demo. | `docs/database/supabase-seed.sql`, panel Supabase |
| **RNF-14** | Interoperabilidad | Identidad Firebase + dominio en PostgreSQL vinculado por `firebase_uid` / `profiles`. | Usuario autenticado sincroniza perfil con tabla `usuarios` vía `usuario-sync.service`. | `services/profile.service.ts`, `services/usuario-sync.service.ts` |
| **RNF-15** | Accesibilidad básica | Semántica HTML en formularios y navegación por teclado en componentes UI. | Labels en formularios de login y modales; contraste en tema dashboard. | `components/auth/login-form.tsx`, `components/ui/` |

## Notas de cumplimiento académico

- El MVP prioriza **demostrabilidad** sobre cumplimiento normativo completo (PCI, firma electrónica, etc.).
- RNF de seguridad en base de datos: RLS habilitada con políticas permisivas de demo; producción debe endurecer políticas (`docs/database/rls-strategy.md`).

# Requerimientos funcionales — AlquilaBogotá MVP

Documento derivado del código en `types/`, `services/`, `app/(dashboard)/`, `lib/auth/` y módulos React. Refleja la implementación actual (prototipo académico), no un marketplace ni procesamiento de pagos reales.

| Código | Nombre | Descripción | Actor principal | Módulos involucrados | Criterio de aceptación | Evidencia sugerida |
|--------|--------|-------------|-----------------|----------------------|------------------------|-------------------|
| **RF-01** | Autenticación, sesión y roles | Inicio de sesión con Firebase Authentication (producción/desarrollo) o login demo E2E; cookie de sesión firmada; onboarding de perfil; selección y cambio de **rol activo**; un usuario puede tener varios roles (`roles[]`). | Todos | `/login`, `/onboarding`, `/perfil`, `middleware.ts`, `services/auth.service.ts`, `services/profile.service.ts` | Usuario no autenticado redirige a `/login`; tras onboarding accede al dashboard; puede cambiar rol activo y ver menú acorde; rutas prohibidas redirigen a `/sin-acceso`. | Captura login/onboarding; prueba E2E `login.spec.ts`; evento `ROL_ACTIVO_CAMBIADO` en trazabilidad. |
| **RF-02** | Gestión de inmuebles | CRUD de inmuebles del arrendador (título, dirección, localidad Bogotá, canon, estado). Un inmueble no puede tener más de un contrato activo simultáneo. | Arrendador, Admin | `/inmuebles`, `services/inmuebles.service.ts` | Arrendador crea/edita solo sus inmuebles; Admin ve todos; códigos `inm-*` autogenerados. | `page-inmuebles`; captura `03-inmuebles.png`; tabla con filtros. |
| **RF-03** | Gestión de contratos | Crear y editar contratos sobre inmuebles propios: fechas, canon, reajuste, codeudor, depósito, inventario, documentos adjuntos, estados (`BORRADOR` → `PENDIENTE_CONFIRMACION` → `CONFIRMADO`, etc.). | Arrendador, Admin | `/contratos`, `services/contratos.service.ts` | Contrato vinculado a inmueble del arrendador; invitación generada al pasar a pendiente; documentos en Storage o mock. | `page-contratos`; captura `04-contratos.png`; adjuntos en bucket `contratos`. |
| **RF-04** | Invitación y confirmación de contrato | Invitación por email al arrendatario; aceptación o rechazo en `/solicitudes-contrato`; actualización de estado del contrato y notificaciones simuladas. | Arrendatario, Arrendador | `/solicitudes-contrato`, `services/invitaciones-contrato.service.ts` | Invitación `PENDIENTE` solo visible al email invitado; aceptar deja contrato `CONFIRMADO`; rechazar registra motivo. | `04b-solicitudes-contrato.png`; E2E solicitudes; trazabilidad `CONTRATO_ACEPTADO` / `CONTRATO_RECHAZADO`. |
| **RF-05** | Pagos de canon reportados | Arrendatario reporta pago mensual con monto, medio y comprobantes; arrendador valida o rechaza; opcional generación de soporte PDF y notificación simulada. **No hay pasarela de pago.** | Arrendatario, Arrendador | `/pagos`, `services/pagos.service.ts`, `services/soporte-pago.service.ts` | Pago creado en `REPORTADO`; validación → `VALIDADO`; comprobantes visibles en visor; soporte PDF descargable. | `05-pagos.png`; `11-visor-documentos.png`; E2E visor documentos. |
| **RF-06** | Servicios públicos | Arrendador configura servicios por contrato; arrendatario reporta pagos por periodo; arrendador valida/rechaza; estados incluyen `VENCIDO`. | Arrendador, Arrendatario | `/servicios`, `services/servicios-contrato.service.ts`, `services/pagos-servicio.service.ts` | Servicio activo por contrato; pago ligado a servicio y periodo; comprobantes en bucket `servicios`. | `06-servicios.png`; trazabilidad `PAGO_SERVICIO_*`. |
| **RF-07** | Mantenimiento | Solicitudes por inmueble, prioridad, tipo, responsabilidad compartida, comentarios, evidencias y cierre; flujo de estados y aceptación de responsabilidad por arrendatario. | Arrendatario, Arrendador | `/mantenimiento`, `services/mantenimiento.service.ts`, `services/mantenimiento-economico.service.ts` | Ticket `ABIERTO` → gestión → `RESUELTO`/`CERRADO`; adjuntos en `mantenimiento` bucket. | `07-mantenimiento.png`; eventos `MANTENIMIENTO_*`. |
| **RF-08** | No renovación | Expediente de no renovación por contrato: borrador, generación de documento/PDF, registro de envío y evidencias; marca contrato `noRenovar`. | Arrendador, Arrendatario | `/no-renovacion`, `services/no-renovacion.service.ts` | Estados `BORRADOR` → `DOCUMENTO_GENERADO` → `ENVIO_REGISTRADO`; PDF descargable; plazo de preaviso calculado. | `08-no-renovacion.png`; PDF `@react-pdf` en `components/pdf/no-renovacion-pdf.tsx`. |
| **RF-09** | Trazabilidad y auditoría | Bitácora append-only de eventos por entidad, usuario, contrato e inmueble; filtrado por control de acceso. | Admin, Arrendador | `/trazabilidad`, `services/trazabilidad.service.ts`, tabla `evento_trazabilidad` | Eventos registrados en acciones CRUD y cambios de estado; usuario solo ve eventos de su alcance. | `09-trazabilidad.png`; reporte `TRAZABILIDAD_GLOBAL`. |
| **RF-10** | Gestión documental | Carga de archivos vía `multi-file-uploader`, persistencia en Supabase Storage (modo SUPABASE) o URLs simuladas (MOCK); metadatos en `archivo_adjunto`; visor modal y descarga. | Todos (según módulo) | `services/file-storage.service.ts`, `services/adjuntos-persistencia.service.ts`, `components/shared/adjuntos-panel.tsx` | Archivo subido tras guardar entidad; listado y visor; trazabilidad `DOCUMENTO_ADJUNTADO`. | Storage buckets documentados; E2E visor; script `npm run check:storage`. |
| **RF-11** | Reportes | Generación de reportes estructurados y exportación PDF (`@react-pdf/renderer`): historial contrato/inmueble, estado de cuenta, cartera, etc. | Admin, Arrendador, Arrendatario | `/reportes`, `services/reportes.service.ts`, `types/reportes.ts` | Usuario con acceso genera reporte según catálogo `REPORTE_CATALOGO`; PDF descargable; evento `REPORTE_GENERADO`. | `10-reportes.png`; componente `reporte-download.tsx`. |
| **RF-12** | Administración y notificaciones | Admin gestiona usuarios mock/referencia; todos los roles consultan notificaciones simuladas del sistema (sin SMTP real en MVP). | Admin (usuarios); Todos (notificaciones) | `/usuarios`, `/notificaciones`, `services/usuarios.service.ts`, `services/notificaciones.service.ts` | Solo Admin accede a usuarios; notificaciones filtradas por email/contrato; estado `SIMULADA` tras registro. | Módulo usuarios; listado notificaciones; seed `data/mock/`. |

## Alcance explícitamente excluido (reglas de proyecto)

- Procesamiento de pagos reales o integración bancaria.
- Firma digital legalmente vinculante (solo adjuntar/descargar documentos).
- Marketplace o publicación de inmuebles para terceros no vinculados.

## Implementación parcial o preparada

| Aspecto | Estado |
|---------|--------|
| Row Level Security estricta en Supabase | Políticas demo permisivas (`mvp_demo_*`); reglas reales en `access-control.service.ts` |
| Envío de correo real | Simulado (`email.service.ts`, notificaciones `SIMULADA`) |
| Asignación rol ADMIN desde UI | No disponible; solo seed/configuración |
| Invitación `EXPIRADA` | Tipo definido; expiración automática no cronometrada en MVP |

## Referencias en código

- Permisos por módulo: `lib/auth/permissions.ts`
- Control de acceso por contrato/inmueble: `services/access-control.service.ts`
- Modo datos: `config/app-mode.ts` (`MOCK` \| `SUPABASE`)

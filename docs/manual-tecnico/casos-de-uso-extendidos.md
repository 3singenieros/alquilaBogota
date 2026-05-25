# Casos de uso extendidos

Descripción alineada con `services/*.service.ts` y flujos de UI en `components/modules/`.

---

## CU-EXT-01 — Inicio de sesión y selección de rol

| Campo | Contenido |
|-------|-----------|
| **Actor principal** | Usuario (cualquier rol) |
| **Actores secundarios** | Firebase Auth; API E2E (solo pruebas) |
| **Descripción** | El usuario se autentica y, si tiene varios roles, selecciona el rol activo para la sesión de trabajo. |
| **Precondiciones** | Aplicación desplegada; credenciales Firebase válidas o `E2E_MODE=true` para demo. |
| **Flujo principal** | 1. Usuario abre `/login`. 2. Ingresa credenciales o pulsa botón demo E2E. 3. Sistema valida con Firebase o `POST /api/e2e/login`. 4. Se emite cookie `alquila_session`. 5. Si `perfilCompletado=false` → `/onboarding`; si no → `/`. 6. Usuario cambia rol activo desde topbar/perfil si aplica. |
| **Flujos alternos** | 3a. Token inválido → permanece en login. 5a. Onboarding: elige roles y completa datos → redirección dashboard. |
| **Postcondiciones** | Sesión firmada; `rolActivo` persistido en token/perfil. |
| **Excepciones** | Firebase no configurado en producción sin E2E; error de red. |
| **Entidades** | `Usuario`, `Profile`, evento `ROL_ACTIVO_CAMBIADO` / `ONBOARDING_COMPLETADO` |

---

## CU-EXT-02 — Crear inmueble

| Campo | Contenido |
|-------|-----------|
| **Actor principal** | Arrendador |
| **Actores secundarios** | — |
| **Descripción** | Registro de un inmueble con datos de ubicación (Bogotá), canon y estado inicial. |
| **Precondiciones** | Sesión ARRENDADOR o ADMIN; módulo inmuebles permitido. |
| **Flujo principal** | 1. Abre `/inmuebles`. 2. Crea registro vía modal. 3. `inmuebles.service` asigna `arrendadorId` y genera `code`. 4. Repositorio persiste. 5. Trazabilidad `CREADO` / `INMUEBLE_ACTUALIZADO`. |
| **Flujos alternos** | 2a. Edición de inmueble existente propio. |
| **Postcondiciones** | Inmueble `DISPONIBLE` (por defecto) en datastore. |
| **Excepciones** | `FORBIDDEN` si rol incorrecto. |
| **Entidades** | `Inmueble`, `EventoTrazabilidad` |

---

## CU-EXT-03 — Crear contrato e invitar arrendatario

| Campo | Contenido |
|-------|-----------|
| **Actor principal** | Arrendador |
| **Actores secundarios** | Sistema de notificaciones (simulado) |
| **Descripción** | El arrendador crea un contrato en borrador o pendiente, adjunta documentos y envía invitación al email del arrendatario. |
| **Precondiciones** | Inmueble propio sin contrato activo en estados `CONFIRMADO` o `PENDIENTE_CONFIRMACION`. |
| **Flujo principal** | 1. Crea contrato en `/contratos` con fechas, canon, email arrendatario. 2. Servicio valida unicidad por inmueble. 3. Estado → `PENDIENTE_CONFIRMACION` (según flujo). 4. Se crea `InvitacionContrato` con token y estado `PENDIENTE`. 5. Notificación `INVITACION_CONTRATO`. 6. Trazabilidad `INVITACION_ENVIADA`. |
| **Flujos alternos** | 3a. Permanece `BORRADOR` sin invitación. 4a. Sincroniza `arrendatarioId` si ya existe perfil con ese email. |
| **Postcondiciones** | Contrato e invitación persistidos; arrendatario ve solicitud en `/solicitudes-contrato`. |
| **Excepciones** | `BusinessRuleError` si inmueble ya tiene contrato activo. |
| **Entidades** | `Contrato`, `InvitacionContrato`, `ArchivoAdjunto`, `Notificacion` |

---

## CU-EXT-04 — Aceptar o rechazar contrato

| Campo | Contenido |
|-------|-----------|
| **Actor principal** | Arrendatario |
| **Actores secundarios** | Arrendador (notificado) |
| **Descripción** | Respuesta a invitación contractual. |
| **Precondiciones** | Invitación `PENDIENTE`; email coincide con sesión. |
| **Flujo principal (aceptar)** | 1. Lista invitaciones en solicitudes. 2. Acepta → `invitaciones-contrato.service`. 3. Invitación `ACEPTADA`. 4. Contrato `CONFIRMADO`, `arrendatarioId` asignado. 5. Notificaciones a ambas partes. 6. Trazabilidad `CONTRATO_ACEPTADO`. |
| **Flujo principal (rechazar)** | 3. Invitación `RECHAZADA` con motivo. 4. Contrato `RECHAZADO`. 5. Notificación y trazabilidad `CONTRATO_RECHAZADO`. |
| **Flujos alternos** | — |
| **Postcondiciones** | Estados terminales coherentes; menú del arrendatario habilita pagos/servicios. |
| **Excepciones** | Invitación no pertenece al usuario; invitación no pendiente. |
| **Entidades** | `InvitacionContrato`, `Contrato`, `Notificacion`, `EventoTrazabilidad` |

---

## CU-EXT-05 — Reportar pago de canon

| Campo | Contenido |
|-------|-----------|
| **Actor principal** | Arrendatario |
| **Actores secundarios** | Arrendador (notificado) |
| **Descripción** | Reporte mensual del canon con comprobantes adjuntos. |
| **Precondiciones** | Contrato accesible y confirmado; rol puede crear en módulo pagos. |
| **Flujo principal** | 1. Crea pago en `/pagos` (mes, monto, medio). 2. Adjunta comprobantes (pendientes hasta guardar o Storage). 3. `pagos.service` crea `PagoReportado` en `REPORTADO`. 4. Notificación `PAGO_REPORTADO`. 5. Trazabilidad `PAGO_REPORTADO` y adjuntos. |
| **Flujos alternos** | 2a. Modo MOCK: URLs simuladas; modo SUPABASE: upload post-create vía `file-storage.actions`. |
| **Postcondiciones** | Registro en `pagos_canon` / mock; comprobantes vinculados. |
| **Excepciones** | Solo arrendatario/admin puede reportar; contrato no permitido. |
| **Entidades** | `PagoReportado`, `ArchivoAdjunto`, `Notificacion` |

---

## CU-EXT-06 — Validar o rechazar pago de canon

| Campo | Contenido |
|-------|-----------|
| **Actor principal** | Arrendador |
| **Actores secundarios** | Arrendatario |
| **Descripción** | Revisión del comprobante y cambio de estado del pago. |
| **Precondiciones** | Pago en `REPORTADO`; contrato del arrendador. |
| **Flujo principal (validar)** | 1. Arrendador valida en tabla/modal. 2. Estado → `VALIDADO`, `validadoPorId`, fecha. 3. Opcional: genera `SoportePago` y PDF. 4. Notificación y trazabilidad `PAGO_VALIDADO` / `SOPORTE_GENERADO`. |
| **Flujo principal (rechazar)** | 2. Estado → `RECHAZADO` con motivo. 3. `PAGO_RECHAZADO`. |
| **Postcondiciones** | Pago en estado terminal; soporte opcional persistido. |
| **Excepciones** | Arrendatario no puede validar (salvo ADMIN). |
| **Entidades** | `PagoReportado`, `SoportePago`, `Notificacion` |

---

## CU-EXT-07 — Configurar servicios públicos del contrato

| Campo | Contenido |
|-------|-----------|
| **Actor principal** | Arrendador |
| **Descripción** | Alta/edición de servicios (energía, agua, gas, etc.) ligados al contrato. |
| **Precondiciones** | Contrato confirmado; acceso al contrato. |
| **Flujo principal** | 1. En `/servicios`, pestaña configuración. 2. Crea `ServicioPublicoContrato` (tipo, empresa, cuenta, periodicidad). 3. Trazabilidad `SERVICIO_CONTRATO_CREADO`. |
| **Flujos alternos** | Inactivar servicio → `SERVICIO_CONTRATO_INACTIVADO`. |
| **Postcondiciones** | Servicios listos para reporte de pagos por periodo. |
| **Entidades** | `ServicioPublicoContrato`, `Contrato`, `Inmueble` |

---

## CU-EXT-08 — Reportar y validar pago de servicio público

| Campo | Contenido |
|-------|-----------|
| **Actor principal** | Arrendatario (reportar); Arrendador (validar) |
| **Descripción** | Ciclo de pago de servicios con comprobante y vencimiento. |
| **Precondiciones** | Servicio activo; periodo definido. |
| **Flujo principal** | 1. Arrendatario reporta pago → `REPORTADO`. 2. Arrendador valida/rechaza → `VALIDADO`/`RECHAZADO`. 3. Sistema puede marcar `VENCIDO` según reglas de negocio. 4. Notificaciones y trazabilidad correspondientes. |
| **Postcondiciones** | `PagoServicioPublico` actualizado con comprobantes. |
| **Entidades** | `PagoServicioPublico`, `ServicioPublicoContrato`, `ArchivoAdjunto` |

---

## CU-EXT-09 — Crear solicitud de mantenimiento

| Campo | Contenido |
|-------|-----------|
| **Actor principal** | Arrendatario o Arrendador |
| **Descripción** | Apertura de ticket con prioridad, tipo y descripción. |
| **Precondiciones** | Acceso al inmueble (por contrato confirmado o propiedad). |
| **Flujo principal** | 1. Crea ticket en `/mantenimiento` estado `ABIERTO`. 2. Adjunta evidencias opcionales. 3. Notificación `MANTENIMIENTO_CREADO`. |
| **Postcondiciones** | `Mantenimiento` persistido. |
| **Entidades** | `Mantenimiento`, `ArchivoAdjunto` |

---

## CU-EXT-10 — Gestionar mantenimiento

| Campo | Contenido |
|-------|-----------|
| **Actor principal** | Arrendador (gestión); Arrendatario (aceptación responsabilidad) |
| **Descripción** | Cambio de estado, responsabilidad económica compartida, comentarios y cierre. |
| **Precondiciones** | Ticket existente. |
| **Flujo principal** | 1. Arrendador pasa a `EN_GESTION`. 2. Define responsabilidad/valores (`mantenimiento-economico.service`). 3. Arrendatario acepta/rechaza si `COMPARTIDO`. 4. Resolución → `RESUELTO`/`CERRADO` con documentos de cierre. |
| **Flujos alternos** | Rechazo de ticket → `RECHAZADO`. Comentarios → `ComentarioMantenimiento`. |
| **Postcondiciones** | Ticket cerrado con trazabilidad completa. |
| **Entidades** | `Mantenimiento`, `ComentarioMantenimiento`, `ArchivoAdjunto` |

---

## CU-EXT-11 — Generar no renovación

| Campo | Contenido |
|-------|-----------|
| **Actor principal** | Arrendador o Arrendatario (parte del contrato) |
| **Descripción** | Creación del expediente y generación del documento formal PDF. |
| **Precondiciones** | Contrato accesible; datos formales de partes. |
| **Flujo principal** | 1. Inicia expediente `BORRADOR`. 2. Completa motivo y partes. 3. Genera documento → `DOCUMENTO_GENERADO`. 4. Descarga PDF (`no-renovacion-pdf.tsx`). 5. Marca contrato `noRenovar`. |
| **Postcondiciones** | `NoRenovacion` con adjuntos de documento. |
| **Entidades** | `NoRenovacion`, `Contrato`, `ArchivoAdjunto` |

---

## CU-EXT-12 — Registrar evidencia de envío (no renovación)

| Campo | Contenido |
|-------|-----------|
| **Actor principal** | Usuario iniciador del expediente |
| **Descripción** | Registro del medio de envío y evidencias (guía, correo certificado simulado). |
| **Precondiciones** | Documento generado. |
| **Flujo principal** | 1. Registra medio, fecha y adjuntos de envío. 2. Estado expediente → `ENVIO_REGISTRADO`. 3. Trazabilidad `NO_RENOVACION_ENVIO_REGISTRADO`. |
| **Postcondiciones** | Evidencias en bucket `no-renovacion`; notificación registrada. |
| **Entidades** | `NoRenovacion`, `ArchivoAdjunto` |

---

## CU-EXT-13 — Consultar trazabilidad

| Campo | Contenido |
|-------|-----------|
| **Actor principal** | Admin o Arrendador |
| **Descripción** | Consulta filtrada de eventos de auditoría. |
| **Precondiciones** | Módulo permitido. |
| **Flujo principal** | 1. Abre `/trazabilidad`. 2. Servicio aplica `filterTrazabilidadEvents`. 3. Muestra tabla con acción, entidad, usuario, fechas. |
| **Postcondiciones** | Solo eventos autorizados visibles. |
| **Entidades** | `EventoTrazabilidad` |

---

## CU-EXT-14 — Generar reporte

| Campo | Contenido |
|-------|-----------|
| **Actor principal** | Usuario con acceso al módulo reportes |
| **Descripción** | Construcción de `ReporteDocumento` y descarga PDF. |
| **Precondiciones** | Filtros válidos (contrato/inmueble según tipo). |
| **Flujo principal** | 1. Selecciona tipo en catálogo `REPORTE_CATALOGO`. 2. `reportes.service` agrega datos y eventos. 3. Render PDF cliente con `@react-pdf/renderer`. 4. `REPORTE_GENERADO` en trazabilidad. |
| **Postcondiciones** | PDF descargado; sin tabla `reportes` persistida (generación on-demand). |
| **Entidades** | `ReporteDocumento` (DTO), `EventoTrazabilidad`, entidades fuente |

---

## CU-EXT-15 — Cargar y consultar documentos

| Campo | Contenido |
|-------|-----------|
| **Actor principal** | Usuario del módulo origen |
| **Actores secundarios** | Supabase Storage |
| **Descripción** | Subida diferida post-creación de entidad, listado y visor modal. |
| **Precondiciones** | Permiso sobre entidad; modo SUPABASE con buckets configurados o MOCK. |
| **Flujo principal** | 1. Usuario selecciona archivos en `multi-file-uploader`. 2. Al guardar entidad, `subirYVincular` en server actions. 3. Metadatos en `archivo_adjunto`. 4. Consulta vía `VerAdjuntosButton` / `adjuntos-panel`. 5. Trazabilidad `DOCUMENTO_ADJUNTADO`. |
| **Flujos alternos** | MOCK: `urlSimulada` sin bytes reales en Storage. |
| **Postcondiciones** | Archivos consultables en visor; path en bucket si SUPABASE. |
| **Excepciones** | Fallo de upload Storage; entidad sin permiso. |
| **Entidades** | `ArchivoAdjunto`, entidad dueña (Pago, Contrato, etc.) |

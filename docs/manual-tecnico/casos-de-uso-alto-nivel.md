# Casos de uso — nivel alto

Identificador **CU-XX** alineado con módulos implementados en `app/(dashboard)/`.

| CU | Nombre | Actor | Propósito | Precondición | Resultado esperado |
|----|--------|-------|-----------|--------------|-------------------|
| CU-01 | Iniciar sesión | Usuario registrado | Acceder al sistema con identidad verificada. | Cuenta Firebase o perfil demo E2E configurado. | Sesión activa; redirección a dashboard u onboarding. |
| CU-02 | Completar perfil y roles | Usuario nuevo | Definir datos personales y roles iniciales. | Primera sesión sin `perfilCompletado`. | Perfil completo; acceso al dashboard según rol activo. |
| CU-03 | Cambiar rol activo | Usuario multirol | Operar la app con otro perfil funcional sin cerrar sesión. | Usuario con `roles.length > 1`. | Menú y datos filtrados según nuevo rol activo. |
| CU-04 | Gestionar inmuebles | Arrendador | Mantener catálogo de propiedades en arriendo. | Rol ARRENDADOR o ADMIN. | Inmueble creado/actualizado con código `inm-*`. |
| CU-05 | Gestionar contratos | Arrendador | Formalizar arrendamiento sobre un inmueble. | Inmueble disponible sin contrato activo conflictivo. | Contrato en estado coherente con documentos opcionales. |
| CU-06 | Responder invitación de contrato | Arrendatario | Aceptar o rechazar propuesta de arrendamiento. | Invitación `PENDIENTE` al email del usuario. | Contrato confirmado o rechazado; notificaciones registradas. |
| CU-07 | Reportar pago de canon | Arrendatario | Informar pago del mes con soporte. | Contrato `CONFIRMADO`. | Pago en estado `REPORTADO` con comprobantes. |
| CU-08 | Validar pago de canon | Arrendador | Confirmar o rechazar comprobante reportado. | Pago `REPORTADO` de su contrato. | Pago `VALIDADO` o `RECHAZADO`; soporte PDF opcional. |
| CU-09 | Configurar servicios del contrato | Arrendador | Definir cuentas de servicios públicos del arriendo. | Contrato confirmado. | Registros en `ServicioPublicoContrato` activos. |
| CU-10 | Reportar y validar pago de servicio | Arrendatario / Arrendador | Ciclo de comprobación de servicios públicos. | Servicio configurado y periodo definido. | Pago de servicio en estado terminal validado o rechazado. |
| CU-11 | Gestionar mantenimiento | Arrendatario / Arrendador | Atender necesidades del inmueble arrendado. | Inmueble accesible al usuario. | Ticket con historial, comentarios y evidencias. |
| CU-12 | Tramitar no renovación | Arrendador / Arrendatario | Documentar decisión de no prorrogar contrato. | Contrato vigente con datos formales. | Expediente con PDF y envío registrado. |
| CU-13 | Consultar trazabilidad | Admin / Arrendador | Auditar acciones sobre entidades. | Módulo trazabilidad permitido. | Listado de eventos filtrado por alcance. |
| CU-14 | Generar reporte | Usuario autorizado | Obtener informe PDF/HTML del negocio. | Acceso al contrato/inmueble del reporte. | Documento `ReporteDocumento` exportado. |
| CU-15 | Gestionar documentos adjuntos | Usuario del módulo | Cargar y consultar archivos de soporte. | Entidad guardada o flujo post-create upload. | Archivos en Storage/mock y visor operativo. |
| CU-16 | Consultar notificaciones | Todos | Ver alertas simuladas del sistema. | Sesión activa. | Listado de notificaciones del usuario. |
| CU-17 | Administrar usuarios | Admin | Revisar usuarios del prototipo. | Rol ADMIN. | Listado/edición según `usuarios.service`. |

## Relación con requerimientos funcionales

| CU | RF |
|----|-----|
| CU-01 – CU-03 | RF-01 |
| CU-04 | RF-02 |
| CU-05 | RF-03 |
| CU-06 | RF-04 |
| CU-07 – CU-08 | RF-05 |
| CU-09 – CU-10 | RF-06 |
| CU-11 | RF-07 |
| CU-12 | RF-08 |
| CU-13 | RF-09 |
| CU-14 | RF-11 |
| CU-15 | RF-10 |
| CU-16 | RF-12 (notificaciones) |
| CU-17 | RF-12 |

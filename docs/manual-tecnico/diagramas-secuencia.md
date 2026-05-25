# Diagramas de secuencia

Interacción entre UI (Next.js), Server Actions, servicios, repositorios y servicios externos. Patrón común: **no acceso directo a datos desde componentes**.

---

## Crear contrato e invitar arrendatario

```mermaid
sequenceDiagram
    actor Arrendador
    participant UI as contratos-module
    participant SA as Server Actions
    participant SVC as contratos.service
    participant REPO as ContratosRepository
    participant INV as InvitacionesRepository
    participant NOT as notificaciones.service
    participant TRZ as trazabilidad

    Arrendador->>UI: Crear contrato + email arrendatario
    UI->>SA: crearContratoAction
    SA->>SVC: crearContrato()
    SVC->>SVC: assertUnSoloContratoActivoPorInmueble
    SVC->>REPO: create(Contrato)
    SVC->>INV: create(InvitacionContrato PENDIENTE)
    SVC->>NOT: registrarNotificacion(INVITACION_CONTRATO)
    SVC->>TRZ: trace INVITACION_ENVIADA
    REPO-->>SVC: Contrato
    SVC-->>UI: OK
    UI-->>Arrendador: Tabla actualizada
```

---

## Aceptar contrato

```mermaid
sequenceDiagram
    actor Arrendatario
    participant UI as solicitudes-contrato-module
    participant SA as Server Actions
    participant INV_SVC as invitaciones-contrato.service
    participant INV as InvitacionesRepository
    participant CTR as ContratosRepository
    participant NOT as notificaciones.service
    participant TRZ as trazabilidad

    Arrendatario->>UI: Aceptar invitación
    UI->>SA: aceptarInvitacionAction
    SA->>INV_SVC: aceptarInvitacionContrato(id)
    INV_SVC->>INV: update(ACEPTADA)
    INV_SVC->>CTR: update(CONFIRMADO, arrendatarioId)
    INV_SVC->>NOT: notificar arrendador y arrendatario
    INV_SVC->>TRZ: CONTRATO_ACEPTADO
    INV_SVC-->>UI: OK
```

---

## Reportar y validar pago de canon

```mermaid
sequenceDiagram
    actor Arrendatario
    actor Arrendador
    participant UI as pagos-module
    participant SA as pagos/actions
    participant PAY as pagos.service
    participant REPO as PagosRepository
    participant FS as file-storage.service
    participant ST as Supabase Storage
    participant SOP as soporte-pago.service

    Arrendatario->>UI: Reportar pago + comprobantes
    UI->>SA: crearPagoAction
    SA->>PAY: crearPago()
    PAY->>REPO: create(REPORTADO)
    PAY->>PAY: notificación PAGO_REPORTADO

    Note over UI,ST: Post-create upload si hay archivos pendientes
    UI->>SA: subir comprobantes
    SA->>FS: upload + vincular archivo_adjunto
    FS->>ST: put object (bucket pagos)

    Arrendador->>UI: Validar pago
    UI->>SA: validarPagoAction
    SA->>PAY: validarPago()
    PAY->>REPO: update(VALIDADO)
    PAY->>SOP: generar soporte (opcional)
    PAY->>PAY: PAGO_VALIDADO + PDF cliente
```

---

## Reportar y validar pago de servicio público

```mermaid
sequenceDiagram
    actor Arrendatario
    actor Arrendador
    participant UI as servicios-module
    participant SA as servicios/actions
    participant PS as pagos-servicio.service
    participant REPO as PagosServicioRepository
    participant FS as file-storage.service

    Arrendatario->>UI: Reportar pago periodo
    UI->>SA: crearPagoServicioAction
    SA->>PS: crearPagoServicio()
    PS->>REPO: create(REPORTADO)
    PS->>PS: notificación + trazabilidad

    Arrendador->>UI: Validar / Rechazar
    UI->>SA: validarPagoServicioAction
    SA->>PS: validar o rechazar
    PS->>REPO: update(VALIDADO|RECHAZADO)
```

---

## Crear y gestionar mantenimiento

```mermaid
sequenceDiagram
    actor Usuario
    actor Arrendador
    participant UI as mantenimiento-module
    participant SA as mantenimiento/actions
    participant MNT as mantenimiento.service
    participant ECO as mantenimiento-economico.service
    participant REPO as MantenimientoRepository
    participant COM as ComentariosRepository

    Usuario->>UI: Nueva solicitud
    UI->>SA: crearMantenimientoAction
    SA->>MNT: crear()
    MNT->>REPO: create(ABIERTO)

    Arrendador->>UI: Cambiar estado / responsabilidad
    UI->>SA: actualizarMantenimientoAction
    SA->>ECO: definir responsabilidad compartida
    ECO->>REPO: update + notificación

    Usuario->>UI: Comentario
    UI->>SA: agregarComentarioAction
    SA->>COM: create(ComentarioMantenimiento)
```

---

## Generar no renovación y registrar envío

```mermaid
sequenceDiagram
    actor Usuario
    participant UI as no-renovacion-module
    participant SA as actions
    participant NR as no-renovacion.service
    participant REPO as NoRenovacionRepository
    participant CTR as ContratosRepository
    participant PDF as no-renovacion-pdf (cliente)

    Usuario->>UI: Iniciar expediente
    UI->>SA: crearNoRenovacionAction
    SA->>NR: crear expediente BORRADOR
    NR->>REPO: create()

    Usuario->>UI: Generar documento
    SA->>NR: generarDocumento()
    NR->>REPO: update(DOCUMENTO_GENERADO)
    UI->>PDF: PDFDownloadLink

    Usuario->>UI: Registrar envío + evidencias
    SA->>NR: registrarEnvio()
    NR->>REPO: update(ENVIO_REGISTRADO)
    NR->>CTR: update(noRenovar)
```

---

## Cargar documento y registrar trazabilidad

```mermaid
sequenceDiagram
    actor Usuario
    participant UI as multi-file-uploader
    participant SA as file-storage.actions
    participant ADJ as adjuntos-persistencia.service
    participant FS as file-storage.service
    participant FILE as FileRepository
    participant ST as Supabase Storage
    participant TRZ as trace-adjuntos

    Usuario->>UI: Seleccionar archivos
    UI->>UI: pendingById hasta guardar entidad
    UI->>SA: subirYVincularPostCreate
    SA->>FS: uploadFile()
    FS->>ST: storage.upload
    FS->>FILE: create(archivo_adjunto)
    SA->>ADJ: vincular entidad
    SA->>TRZ: DOCUMENTO_ADJUNTADO
```

---

## Generar reporte

```mermaid
sequenceDiagram
    actor Usuario
    participant UI as reportes-module
    participant SA as reportes actions
    participant REP as reportes.service
    participant REPOS as Repositorios múltiples
    participant TRZ as trazabilidad
    participant PDF as reporte-generico-pdf

    Usuario->>UI: Elegir tipo + filtros
    UI->>SA: generarReporteAction
    SA->>REP: construir ReporteDocumento
    REP->>REPOS: contratos, pagos, eventos...
    REP->>TRZ: REPORTE_GENERADO
    REP-->>UI: ReporteDocumento
    UI->>PDF: render PDFDownloadLink
    Usuario->>Usuario: Descarga PDF
```

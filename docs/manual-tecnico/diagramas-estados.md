# Diagramas de estado

Estados definidos en `types/index.ts` y enums PostgreSQL en `docs/database/supabase-schema.sql`.

---

## Contrato (`EstadoContrato`)

El contrato gobierna el ciclo de vida del arrendamiento. Transiciones principales vía `contratos.service` e `invitaciones-contrato.service`.

```mermaid
stateDiagram-v2
    [*] --> BORRADOR
    BORRADOR --> PENDIENTE_CONFIRMACION : enviar invitación
    PENDIENTE_CONFIRMACION --> CONFIRMADO : arrendatario acepta
    PENDIENTE_CONFIRMACION --> RECHAZADO : arrendatario rechaza
    CONFIRMADO --> TERMINADO : fin gestionado
    CONFIRMADO --> VENCIDO : fecha fin superada
    BORRADOR --> CANCELADO : cancelar borrador
    PENDIENTE_CONFIRMACION --> CANCELADO : cancelar
    RECHAZADO --> [*]
    CANCELADO --> [*]
    TERMINADO --> [*]
    VENCIDO --> [*]
```

**Explicación:** `BORRADOR` permite editar sin compromiso; `PENDIENTE_CONFIRMACION` espera respuesta de invitación; `CONFIRMADO` habilita pagos y servicios. Estados terminales cierran el ciclo operativo.

---

## Invitación de contrato (`EstadoInvitacionContrato`)

```mermaid
stateDiagram-v2
    [*] --> PENDIENTE
    PENDIENTE --> ACEPTADA : aceptarInvitacionContrato
    PENDIENTE --> RECHAZADA : rechazar
    PENDIENTE --> EXPIRADA : expiración (tipo definido, implementación parcial sin job automático)
    ACEPTADA --> [*]
    RECHAZADA --> [*]
    EXPIRADA --> [*]
```

**Explicación:** Una invitación pendiente bloquea la confirmación hasta respuesta del arrendatario con email coincidente.

---

## Pago de canon (`EstadoPago` / `PagoReportado`)

```mermaid
stateDiagram-v2
    [*] --> REPORTADO : crearPago (arrendatario)
    REPORTADO --> VALIDADO : validar (arrendador)
    REPORTADO --> RECHAZADO : rechazar (arrendador)
    VALIDADO --> [*]
    RECHAZADO --> [*]
```

**Explicación:** No existe pasarela de pago; `REPORTADO` indica declaración del arrendatario; el arrendador certifica con `VALIDADO` y puede emitir `SoportePago` PDF.

---

## Pago de servicio público (`EstadoPagoServicioPublico`)

```mermaid
stateDiagram-v2
    [*] --> PENDIENTE
    PENDIENTE --> REPORTADO : reportar pago
    REPORTADO --> VALIDADO : validar
    REPORTADO --> RECHAZADO : rechazar
    PENDIENTE --> VENCIDO : vencimiento periodo
    REPORTADO --> VENCIDO : regla de mora
    VALIDADO --> [*]
    RECHAZADO --> [*]
    VENCIDO --> [*]
```

**Explicación:** Incluye estado inicial `PENDIENTE` antes del reporte del arrendatario; `VENCIDO` alerta mora en servicios.

---

## Mantenimiento (`EstadoMantenimiento`)

```mermaid
stateDiagram-v2
    [*] --> ABIERTO
    ABIERTO --> EN_GESTION : asignar/gestionar
    EN_GESTION --> RESUELTO : trabajo realizado
    RESUELTO --> CERRADO : cierre formal
    ABIERTO --> RECHAZADO : rechazar solicitud
    EN_GESTION --> RECHAZADO : rechazar
    CERRADO --> [*]
    RECHAZADO --> [*]
```

**Explicación:** Paralelamente puede existir subestado de **aceptación de responsabilidad** (`AceptacionResponsabilidadMantenimiento`: PENDIENTE, ACEPTADA, RECHAZADA) para reparto de costos.

---

## No renovación (`EstadoNoRenovacion`)

```mermaid
stateDiagram-v2
    [*] --> BORRADOR
    BORRADOR --> PENDIENTE_GENERACION : preparar documento
    PENDIENTE_GENERACION --> DOCUMENTO_GENERADO : PDF generado
    DOCUMENTO_GENERADO --> ENVIO_REGISTRADO : registrar envío
    BORRADOR --> ANULADA : anular
    DOCUMENTO_GENERADO --> ANULADA : anular
    ENVIO_REGISTRADO --> [*]
    ANULADA --> [*]
```

**Explicación:** El expediente acumula adjuntos de documento y de envío; el contrato puede marcarse `noRenovar` en paralelo.

**Envío (`EstadoEnvioNoRenovacion`):** `PENDIENTE` → `REGISTRADO` (o `ERROR` en fallos simulados).

---

## Notificación (`EstadoNotificacion`)

```mermaid
stateDiagram-v2
    [*] --> PENDIENTE
    PENDIENTE --> SIMULADA : registrarNotificacion / simular envío
    PENDIENTE --> ERROR : fallo simulado
    SIMULADA --> [*]
    ERROR --> [*]
```

**Explicación:** Las notificaciones no salen por SMTP real en el MVP; `SIMULADA` documenta el acto para la demo.

---

## Evento de trazabilidad

Los eventos **no cambian de estado**; son registros append-only. Se modelan como:

```mermaid
stateDiagram-v2
    [*] --> Registrado : create()
    Registrado --> [*] : inmutable
```

**Explicación:** La “transición” es la creación del evento con `accion`, `estadoAnterior` y `estadoNuevo` opcionales reflejando cambios en otras entidades.

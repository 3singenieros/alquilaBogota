# Modelo relacional — resumen

Fuente: `docs/database/supabase-schema.sql` (alineado con `types/index.ts`).

> **Nota:** Los reportes (`ReporteDocumento`) **no** se persisten en tabla dedicada; se generan on-demand en `services/reportes.service.ts`.

---

## Tablas de identidad y roles

| Tabla | PK | FK principales | Propósito |
|-------|-----|----------------|-----------|
| `usuarios` | `id` (text) | — | Usuario de dominio del MVP; roles, contacto, `firebase_uid`, soft delete `deleted_at` |
| `user_roles` | `id` (uuid) | `usuario_id` → `usuarios` | Relación N:M usuario–rol (`app_rol`) |
| `profiles` | `id` (text) | — | Perfil vinculado a Firebase Auth; array `roles`, onboarding |

---

## Inmuebles y contratos

| Tabla | PK | FK principales | Propósito |
|-------|-----|----------------|-----------|
| `inmuebles` | `id` | `arrendador_id` → `usuarios` | Propiedad en arriendo (ubicación Bogotá, canon, estado) |
| `contratos` | `id` | `inmueble_id`, `arrendador_id`, `arrendatario_id` | Arrendamiento: fechas, canon, estados, codeudor, no renovación |
| `invitaciones_contrato` | `id` | `contrato_id` → `contratos` | Invitación al arrendatario (`token_invitacion`, estado texto) |

---

## Documentos

| Tabla | PK | FK principales | Propósito |
|-------|-----|----------------|-----------|
| `archivo_adjunto` | `id` | `contrato_id`, `inmueble_id`, `uploaded_by` (opc.) | Metadatos de archivos en Storage (bucket, path, public_url) |
| `contrato_documentos` | `id` (uuid) | `contrato_id`, `archivo_id` | Puente contrato ↔ adjuntos |

---

## Pagos

| Tabla | PK | FK principales | Propósito |
|-------|-----|----------------|-----------|
| `pagos_canon` | `id` | `contrato_id`, `reportado_por_id`, validadores | Pagos de canon reportados (`estado_pago`) |
| `soportes_pago` | `id` | `pago_id`, `contrato_id`, arrendador/arrendatario | Soporte formal tras validación (`numero_soporte` único) |
| `servicios_publicos_contrato` | `id` | `contrato_id`, `inmueble_id` | Configuración de servicios por contrato |
| `pagos_servicios_publicos` | `id` | `servicio_publico_contrato_id`, `contrato_id` | Pagos por periodo de servicios (`estado_pago_servicio`) |

---

## Mantenimiento

| Tabla | PK | FK principales | Propósito |
|-------|-----|----------------|-----------|
| `mantenimientos` | `id` | `inmueble_id`, `solicitado_por_id` | Tickets de mantenimiento |
| `mantenimiento_comentarios` | `id` | `mantenimiento_id`, `inmueble_id`, `usuario_id` | Hilo de comentarios |
| `mantenimiento_documentos` | `id` (uuid) | `mantenimiento_id`, `archivo_id` | Evidencias y cierre documental |

---

## No renovación, notificaciones, auditoría

| Tabla | PK | FK principales | Propósito |
|-------|-----|----------------|-----------|
| `no_renovaciones` | `id` | `contrato_id`, `inmueble_id` | Expediente JSON (`datos`) + `estado_no_renovacion` |
| `notificaciones` | `id` | `contrato_id` (opc.) | Cola simulada de alertas al usuario |
| `evento_trazabilidad` | `id` | `contrato_id`, `inmueble_id`, `pago_id`, `usuario_afectado_id` | Bitácora de auditoría (acción, estados, JSON metadata) |

---

## Enumeraciones PostgreSQL

| Enum | Valores (resumen) |
|------|-------------------|
| `app_rol` | ADMIN, ARRENDADOR, ARRENDATARIO |
| `estado_contrato` | BORRADOR, PENDIENTE_CONFIRMACION, CONFIRMADO, RECHAZADO, CANCELADO, TERMINADO, VENCIDO |
| `estado_inmueble` | DISPONIBLE, ARRENDADO, MANTENIMIENTO |
| `estado_pago` | REPORTADO, VALIDADO, RECHAZADO |
| `estado_pago_servicio` | PENDIENTE, REPORTADO, VALIDADO, RECHAZADO, VENCIDO |
| `estado_mantenimiento` | ABIERTO, EN_GESTION, RESUELTO, CERRADO, RECHAZADO |
| `estado_no_renovacion` | BORRADOR, PENDIENTE_GENERACION, DOCUMENTO_GENERADO, ENVIO_REGISTRADO, ANULADA |
| `tipo_mantenimiento` | LOCATIVO, ESTRUCTURAL, … |
| `tipo_responsabilidad` | ARRENDADOR, ARRENDATARIO, COMPARTIDO, POR_DEFINIR |

---

## Relaciones principales (cardinalidad)

```
usuarios 1 ── * inmuebles (arrendador)
inmuebles 1 ── * contratos
usuarios 1 ── * contratos (arrendador / arrendatario opcional)
contratos 1 ── * invitaciones_contrato
contratos 1 ── * pagos_canon
contratos 1 ── * servicios_publicos_contrato
servicios_publicos_contrato 1 ── * pagos_servicios_publicos
pagos_canon 1 ── 0..1 soportes_pago
inmuebles 1 ── * mantenimientos
mantenimientos 1 ── * mantenimiento_comentarios
contratos 1 ── 0..1 no_renovaciones (vía contrato.no_renovacion_id en app)
archivo_adjunto * ── vinculado por entidad_tipo + entidad_id (polimórfico)
evento_trazabilidad * ── contexto opcional contrato / inmueble / pago
```

---

## Índices relevantes

- `idx_inmuebles_arrendador`, `idx_contratos_arrendador`, `idx_contratos_arrendatario`
- `idx_pagos_canon_contrato`, `idx_pagos_servicio_contrato`
- `idx_trz_entidad`, `idx_trz_fecha`, `idx_archivo_adjunto_entidad`

---

## Seguridad en base de datos

RLS **habilitada** en tablas principales con políticas demo `mvp_demo_*` (acceso total para prototipo). Estrategia de endurecimiento: `docs/database/rls-strategy.md`.

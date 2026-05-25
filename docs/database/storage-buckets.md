# Supabase Storage — buckets del MVP

## Buckets requeridos

| Bucket | Propósito | Entidad asociada | Ruta sugerida |
|--------|-----------|------------------|---------------|
| `contratos` | Documentos contractuales (PDF, Word) | `CONTRATO` | `CONTRATO/{contratoId}/{timestamp}-{filename}` |
| `pagos` | Comprobantes de canon | `PAGO` | `PAGO/{pagoId}/{timestamp}-{filename}` |
| `servicios` | Comprobantes de servicios públicos | `PAGO_SERVICIO_PUBLICO` | `PAGO_SERVICIO_PUBLICO/{pagoId}/{timestamp}-{filename}` |
| `mantenimiento` | Evidencias y actas de cierre | `MANTENIMIENTO` | `MANTENIMIENTO/{ticketId}/{timestamp}-{filename}` |
| `no-renovacion` | Carta, guía y evidencias de envío | `NO_RENOVACION` | `NO_RENOVACION/{expedienteId}/{timestamp}-{filename}` |
| `evidencias` | Genérico / temporal | varias | `{entidadTipo}/{entidadId}/{timestamp}-{filename}` |

## Verificación (`npm run check:storage`)

- Con **anon key** el script prueba cada bucket con `list()` y una subida de prueba (no usa `listBuckets`, que requiere service role).
- Opcional en `.env.local`: `SUPABASE_SERVICE_ROLE_KEY` para listar buckets en el check (no commitear; solo local/CI).

## Configuración

1. Ejecutar `docs/database/supabase-storage-setup.sql` en el SQL Editor de Supabase.
2. Verificar con `npm run check:storage`.
3. Variables en `.env.local` (las mismas que PostgreSQL):

```env
NEXT_PUBLIC_APP_MODE=SUPABASE
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Seguridad (demo académico)

- Buckets **privados** por defecto en el script de setup.
- La app genera **signed URLs** (1 h) desde el servidor para ver/descargar.
- Políticas permisivas para el prototipo; en producción usar Supabase Auth + RLS de Storage.

## Metadata en PostgreSQL

Cada archivo subido crea/actualiza fila en `archivo_adjunto` con:

- `entidad_tipo`, `entidad_id`, `contrato_id`, `inmueble_id`
- `bucket`, `path`, `public_url`
- `nombre`, `tipo`, `tamano`, `uploaded_by`, `uploaded_at`

Tablas puente: `contrato_documentos`, `mantenimiento_documentos`.

## Referencias

- Setup SQL: `docs/database/supabase-storage-setup.sql`
- Servicio: `services/file-storage.service.ts`
- Persistencia: `services/adjuntos-persistencia.service.ts`

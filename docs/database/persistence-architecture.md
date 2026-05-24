# Arquitectura de persistencia híbrida

## Modos de operación

Configuración vía `config/app-mode.ts`:

| Variable | Valor | Comportamiento |
|----------|-------|----------------|
| `NEXT_PUBLIC_APP_MODE` | `MOCK` | Repositorios mock en memoria |
| `NEXT_PUBLIC_APP_MODE` | `SUPABASE` | Repositorios Supabase (requiere env) |
| *(sin APP_MODE)* | — | `MOCK` por defecto; `SUPABASE` si hay URL + key y `USE_MOCK_DATA=false` |

## Capas

```
UI (components) → Services (lógica) → Repositories (interfaces)
                                          ├── *MockRepository
                                          └── supabase/*Repository
```

Los **services no conocen** el origen de datos. Solo usan `getXxxRepository()` desde `repositories/index.ts`.

## Migración incremental

### Fase 1 (prioritaria)
- `usuarios`, `profiles`, `user_roles`
- `inmuebles`
- `contratos`, `invitaciones_contrato`
- `evento_trazabilidad`

### Fase 2
- `pagos_canon`, `soportes_pago`
- `servicios_publicos_contrato`, `pagos_servicios_publicos`
- `mantenimientos`, comentarios, documentos
- `no_renovaciones`, `notificaciones`
- `archivo_adjunto` + Supabase Storage

## Storage

Buckets sugeridos (ver `lib/config.ts` → `STORAGE_BUCKETS`):

- `contratos` — documentos contractuales
- `pagos` — comprobantes de canon
- `servicios` — recibos de servicios públicos
- `mantenimiento` — evidencias y actas
- `no-renovacion` — cartas y guías
- `evidencias` — genérico

Rutas sugeridas: `lib/supabase/storage-paths.ts`  
Servicio de abstracción: `services/file-storage.service.ts`

## Pruebas E2E futuras

Con `NEXT_PUBLIC_APP_MODE=SUPABASE` y seed SQL:

1. Login Firebase con usuario demo
2. CRUD inmueble → verificar fila en PostgreSQL
3. Crear contrato → evento en `evento_trazabilidad`
4. Generar reporte PDF desde datos reales

## Referencias

- Esquema: `docs/database/supabase-schema.sql`
- Tipos DB: `lib/supabase/types.ts`
- Repositorios: `repositories/supabase/`

# Estrategia Row Level Security (RLS)

> **Estado actual:** políticas permisivas de demo (`using (true)`).  
> Este documento define la estrategia futura alineada con `services/access-control.service.ts`.

## Roles

| Rol | Alcance |
|-----|---------|
| **ADMIN** | Lectura/escritura global |
| **ARRENDADOR** | Inmuebles propios, contratos donde es arrendador, pagos/servicios/mantenimiento de esos contratos |
| **ARRENDATARIO** | Contratos donde es arrendatario, pagos reportados propios, mantenimiento de inmuebles vinculados |

## Limitación por ownership

### Inmuebles
```sql
-- ARRENDADOR: solo inmuebles donde arrendador_id = auth.uid() mapeado a usuarios.id
-- ARRENDATARIO: inmuebles con contrato activo donde es arrendatario
```

### Contratos
```sql
-- ARRENDADOR: arrendador_id = usuario_actual
-- ARRENDATARIO: arrendatario_id = usuario_actual OR email_arrendatario = email sesión
```

### Pagos / servicios / mantenimiento
Acceso derivado del contrato o inmueble padre (subquery sobre `contratos` / `inmuebles`).

### Trazabilidad
- **ADMIN**: todos los eventos
- **ARRENDADOR / ARRENDATARIO**: eventos donde `contrato_id` o `inmueble_id` estén en su scope

## Integración Firebase + Supabase

1. Firebase Auth emite JWT en el cliente.
2. Fase futura: custom claim o tabla `profiles` con `firebase_uid`.
3. RLS usará `auth.jwt() ->> 'sub'` cruzado con `profiles.firebase_uid` → `usuarios.id`.

## Implementación incremental

1. Mantener políticas demo durante desarrollo académico.
2. Activar RLS estricto módulo por módulo (contratos → pagos → mantenimiento).
3. Validar con pruebas E2E por rol antes de desactivar mock.

## Service role

Operaciones administrativas o jobs (reportes batch) usarán **service role key** solo en servidor, nunca expuesta al cliente.

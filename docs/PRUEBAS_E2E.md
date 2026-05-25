# Pruebas E2E — Playwright (MVP AlquilaBogotá)

Pruebas funcionales automatizadas para validar el MVP y generar **evidencias visuales** (capturas PNG) y **reporte HTML** para la tesis.

## Requisitos

- Node.js 20+
- Dependencias: `npm install`
- Navegadores Playwright: `npx playwright install chromium`
- Servidor local en `http://localhost:3000` (lo levanta Playwright automáticamente con `npm run test:e2e`)

## Modo E2E (sin Google)

Para no depender de Firebase en CI o en la laptop de pruebas, el login demo se habilita con variables de entorno (solo desarrollo/pruebas):

```env
E2E_MODE=true
NEXT_PUBLIC_E2E_MODE=true
```

(O también `E2E_AUTH_ENABLED` / `NEXT_PUBLIC_E2E_AUTH` — equivalentes.)

En `/login` aparecen botones **ADMIN**, **ARRENDADOR** y **ARRENDATARIO** que crean sesión vía `POST /api/e2e/login` usando los perfiles de `data/mock/seed-profiles.ts`.

**No activar en producción.**

`npm run test:e2e` ya exporta estas variables al arrancar `next dev`.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run test:e2e` | Ejecuta todas las pruebas E2E (setup + flujos + evidencias tesis) |
| `npm run test:e2e:ui` | Modo interactivo Playwright UI |
| `npm run test:e2e:report` | Abre el reporte HTML del último run |

## Estructura

```
tests/e2e/
  auth.setup.ts           # Sesión ADMIN guardada en playwright/.auth/
  login.spec.ts           # Pantalla login y acceso demo
  flows.spec.ts           # Un test por módulo principal
  mvp-evidencias-tesis.spec.ts  # Recorrido + capturas nombradas
  helpers/
    auth.ts
    evidencias.ts
playwright.config.ts
```

## Qué valida cada flujo

| Prueba | Valida |
|--------|--------|
| Login | Formulario visible, botones E2E, redirección al dashboard |
| Dashboard | `page-dashboard` y resumen |
| Inmuebles | Módulo carga (`page-inmuebles`) |
| Contratos | Módulo carga (`page-contratos`) |
| Solicitudes contrato | Pantalla de solicitudes (o sin acceso según rol) |
| Pagos | Módulo pagos reportados |
| Servicios | Módulo servicios públicos |
| Mantenimiento | Tickets de mantenimiento |
| No renovación | Expedientes de no renovación |
| Trazabilidad | Bitácora de eventos |
| Reportes | Generación / vista de reportes |
| Visor documentos | Modal de adjuntos en pagos (si hay comprobantes en datos) |

## Evidencias para la tesis

Tras `npm run test:e2e`, las capturas del recorrido tesis quedan en:

```
test-results/evidencias/
  01-login.png
  02-dashboard.png
  03-inmuebles.png
  04-contratos.png
  04b-solicitudes-contrato.png  (si el menú está visible)
  05-pagos.png
  06-servicios.png
  07-mantenimiento.png
  08-no-renovacion.png
  09-trazabilidad.png
  10-reportes.png
  11-visor-documentos.png
```

Playwright también guarda capturas por test en `test-results/` y videos en fallos (`retain-on-failure`).

## Reporte HTML

1. Ejecutar: `npm run test:e2e`
2. Abrir: `npm run test:e2e:report`  
   o manualmente: `npx playwright show-report playwright-report`

El reporte incluye pasos, tiempos, trazas (en reintentos) y enlaces a screenshots.

## data-testid

Convenciones usadas en la UI:

- `page-login`, `page-dashboard`, `page-inmuebles`, …
- `nav-dashboard`, `nav-pagos`, … (sidebar)
- `login-form`, `e2e-login-admin`, `ver-adjuntos-button`, `document-viewer`

## Datos

Las pruebas asumen perfiles demo (`admin@demo.edu`, etc.) disponibles en mock o en Supabase tras seed. Sin datos, los módulos cargan vacíos pero las pantallas deben mostrarse.

## Solución de problemas

- **403 en /api/e2e/login**: falta `E2E_AUTH_ENABLED=true`.
- **Timeout en login**: verificar que `npm run dev` responde en el puerto 3000.
- **Sin comprobantes en visor**: reportar un pago con archivo en la app o usar seed con adjuntos en Storage.

# Evidencias de pruebas — Playwright E2E

Documentación de las pruebas automatizadas existentes en el repositorio. Fuente: `playwright.config.ts`, `tests/e2e/`, `docs/PRUEBAS_E2E.md`.

---

## Resumen cuantitativo

| Proyecto Playwright | Archivo | Cantidad de pruebas |
|---------------------|---------|---------------------|
| `setup` | `auth.setup.ts` | 1 |
| `login` | `login.spec.ts` | 2 |
| `e2e` | `flows.spec.ts` | 11 |
| `evidencias` | `mvp-evidencias-tesis.spec.ts` | 11 |
| **Total** | | **25** |

Configuración: un worker (`workers: 1`), timeout global 90s (evidencias 20s por test), Chromium Desktop, servidor `npm run dev` con `E2E_MODE` y `NEXT_PUBLIC_APP_MODE=MOCK`.

---

## Rutas y módulos probados

| Prueba (flows / evidencias) | Ruta | `data-testid` página |
|----------------------------|------|----------------------|
| Dashboard | `/` | `page-dashboard` |
| Inmuebles | `/inmuebles` | `page-inmuebles` |
| Contratos | `/contratos` | `page-contratos` |
| Solicitudes contrato | `/solicitudes-contrato` | `page-solicitudes-contrato` |
| Pagos reportados | `/pagos` | `page-pagos` |
| Servicios públicos | `/servicios` | `page-servicios` |
| Mantenimiento | `/mantenimiento` | `page-mantenimiento` |
| No renovación | `/no-renovacion` | `page-no-renovacion` |
| Trazabilidad | `/trazabilidad` | `page-trazabilidad` |
| Reportes | `/reportes` | `page-reportes` |
| Login | `/login` | `page-login` |
| Visor documentos | `/pagos` (modal) | `ver-adjuntos-button`, `document-viewer-close` |

Navegación lateral: `nav-dashboard`, `nav-pagos`, etc.

---

## Autenticación en pruebas

- Setup guarda sesión ADMIN en `playwright/.auth/admin.json`.
- Helper `loginE2eSession` usa `page.request.post` a `/api/e2e/login` (comparte cookies con el browser context).
- Botones: `e2e-login-admin`, `e2e-login-arrendador`, `e2e-login-arrendatario`.

Perfiles demo alineados con `data/mock/seed-profiles.ts` / seed SQL.

---

## Capturas para tesis

Tras `npm run test:e2e`, el proyecto **evidencias** genera PNG nombrados en:

```
test-results/evidencias/
  01-login.png
  02-dashboard.png
  03-inmuebles.png
  04-contratos.png
  04b-solicitudes-contrato.png   (si el menú está visible para ADMIN)
  05-pagos.png
  06-servicios.png
  07-mantenimiento.png
  08-no-renovacion.png
  09-trazabilidad.png
  10-reportes.png
  11-visor-documentos.png
```

Playwright también guarda screenshots por test bajo `test-results/` y **video** en fallos (`retain-on-failure`).

---

## Reporte HTML Playwright

| Elemento | Ubicación / comando |
|----------|---------------------|
| Carpeta reporte | `playwright-report/` |
| Generación | Automática al finalizar `npm run test:e2e` |
| Visualización | `npm run test:e2e:report` o `npx playwright show-report` |

Incluye: estado pass/fail, duración, screenshots adjuntos, traza en primer reintento (`trace: on-first-retry`).

---

## Scripts npm

| Script | Función |
|--------|---------|
| `npm run test:e2e` | Suite completa + levanta dev server |
| `npm run test:e2e:ui` | Modo UI interactivo |
| `npm run test:e2e:report` | Abre último reporte HTML |

---

## Historial de correcciones relevantes

| Problema | Solución aplicada |
|----------|-------------------|
| Setup timeout en dashboard | `loginE2eSession` con `page.request` en lugar de `request` aislado de Playwright |
| Test evidencias colgado | División en 11 tests independientes + `safeScreenshot` |
| 24/25 tests pasando | Visor documentos: `data-testid="document-viewer-close"` en footer del modal (dos botones “Cerrar”) |
| SSR y PDF | `SoportePagoDownload` con `dynamic(..., { ssr: false })` para evitar error 500 |

Estado documentado al generar este manual: suite **25/25** en configuración estándar MOCK + E2E.

---

## Limitaciones de las pruebas E2E

- No sustituyen pruebas unitarias exhaustivas de servicios.
- Validan **carga de pantallas** y flujos UI críticos, no todos los caminos de negocio (p. ej. cada transición de estado).
- Modo MOCK: no verifican persistencia real en Supabase Storage (probar manualmente con `SUPABASE` + seed).
- Visor de documentos en pagos **depende** de que existan comprobantes en datos; si no hay, el test puede omitir interacción (ver `docs/PRUEBAS_E2E.md`).

---

## Evidencia sugerida para tesis

1. Capturas `test-results/evidencias/*.png`.
2. Pantallazo o export del reporte HTML Playwright.
3. Tabla de requerimientos RF con referencia a pruebas (véase `requerimientos-funcionales.md`).
4. Opcional: video de fallo si se documenta corrección de regresiones.

---

## Referencias

- `docs/PRUEBAS_E2E.md`
- `playwright.config.ts`
- Commit: *Agregar pruebas E2E con Playwright, login demo y capturas de evidencia para la tesis.*

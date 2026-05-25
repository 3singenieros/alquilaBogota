# Manual técnico — AlquilaBogotá MVP

Índice de la documentación técnica del prototipo **AlquilaBogotá** (gestión de arrendamientos activos). Los archivos de esta carpeta se derivan del código, esquema SQL y pruebas E2E implementados; están listos para revisión e integración en Notion o en el documento final de tesis.

**Repositorio de código fuente:** [github.com/3singenieros/alquilaBogota](https://github.com/3singenieros/alquilaBogota)

---

## Mapeo con requisitos de la universidad

| # | Componente exigido | Archivo(s) en este manual | Notas |
|---|-------------------|---------------------------|-------|
| 1 | Requerimientos funcionales | [`requerimientos-funcionales.md`](requerimientos-funcionales.md) | RF-01 a RF-12 alineados con módulos reales |
| 2 | Requerimientos no funcionales por tipo | [`requerimientos-no-funcionales.md`](requerimientos-no-funcionales.md) | RNF-01 a RNF-15 (seguridad, usabilidad, rendimiento, etc.) |
| 3 | Modelo relacional de la base de datos | [`modelo-relacional-resumen.md`](modelo-relacional-resumen.md) | Resumen de tablas, PK, FK y relaciones; fuente `docs/database/supabase-schema.sql` |
| 4 | Script de generación de la base de datos | [`script-bd-referencia.md`](script-bd-referencia.md) | Referencia y orden de ejecución de schema, seed y storage |
| 5 | Definición de actores y roles | [`actores-y-roles.md`](actores-y-roles.md) | ADMIN, ARRENDADOR, ARRENDATARIO; rol activo y permisos |
| 6 | Casos de uso (alto nivel y extendidos) | [`casos-de-uso-alto-nivel.md`](casos-de-uso-alto-nivel.md), [`casos-de-uso-extendidos.md`](casos-de-uso-extendidos.md) | CU resumidos y 15 flujos detallados |
| 7 | Diagrama de clases | [`diagrama-clases.mmd`](diagrama-clases.mmd) | Mermaid; entidades de `types/` |
| 8 | Diagrama de estados por clase | [`diagramas-estados.md`](diagramas-estados.md) | Un diagrama por entidad con ciclo de vida (contrato, pago, mantenimiento, etc.) |
| 9 | Diagrama de colaboración por proceso | [`diagramas-colaboracion.md`](diagramas-colaboracion.md) | Flowcharts actor–componente por proceso |
| 10 | Diagrama de secuencia por proceso | [`diagramas-secuencia.md`](diagramas-secuencia.md) | Ocho secuencias de procesos principales |
| 11 | Diagrama de componentes | [`diagrama-componentes.mmd`](diagrama-componentes.mmd) | Capas Next.js, services, repositories, Firebase, Supabase |
| 12 | Diagrama de distribución | [`diagrama-distribucion.mmd`](diagrama-distribucion.mmd) | Cliente, hosting, servicios cloud |
| 13 | Código fuente en repositorio web | Repositorio GitHub (enlace arriba) + [`arquitectura-general.md`](arquitectura-general.md) | Estructura de carpetas y stack; el código no se duplica en el manual |

**Complementos (no sustituyen ítems obligatorios, apoyan la tesis):**

| Archivo | Uso recomendado |
|---------|-----------------|
| [`arquitectura-general.md`](arquitectura-general.md) | Capítulo de diseño / arquitectura de software |
| [`evidencias-pruebas.md`](evidencias-pruebas.md) | Pruebas E2E Playwright y evidencias visuales (`docs/PRUEBAS_E2E.md`) |

---

## Índice de archivos (orden de lectura sugerido)

### 1. [`requerimientos-funcionales.md`](requerimientos-funcionales.md)

Lista de **12 requerimientos funcionales** (RF-01 a RF-12): autenticación, inmuebles, contratos, invitaciones, pagos de canon, servicios públicos, mantenimiento, no renovación, trazabilidad, documentos, reportes y administración. Cada RF incluye actor, módulos, criterio de aceptación y evidencia sugerida. Documenta también alcance excluido (pagos reales, firma digital, marketplace).

→ **Universidad: ítem 1**

---

### 2. [`requerimientos-no-funcionales.md`](requerimientos-no-funcionales.md)

**15 tipos** de requerimientos no funcionales (RNF-01 a RNF-15): seguridad, usabilidad, rendimiento, disponibilidad, escalabilidad, mantenibilidad, portabilidad, compatibilidad, trazabilidad, integridad, almacenamiento documental, auditoría, respaldo, interoperabilidad y accesibilidad básica. Indica el componente del sistema que materializa cada criterio.

→ **Universidad: ítem 2**

---

### 3. [`actores-y-roles.md`](actores-y-roles.md)

Descripción de **Administrador**, **Arrendador** y **Arrendatario**: permisos, módulos visibles, restricciones y acciones principales. Incluye la nota sobre **roles múltiples** y **rol activo**, con matriz módulo ↔ rol.

→ **Universidad: ítem 5**

---

### 4. [`casos-de-uso-alto-nivel.md`](casos-de-uso-alto-nivel.md)

**17 casos de uso** resumidos (CU-01 a CU-17): actor, propósito, precondición y resultado esperado. Relación con los RF.

→ **Universidad: ítem 6 (parte alto nivel)**

---

### 5. [`casos-de-uso-extendidos.md`](casos-de-uso-extendidos.md)

**15 casos extendidos** con flujo principal, alternos, postcondiciones, excepciones y entidades: login, inmuebles, contrato/invitación, pagos, servicios, mantenimiento, no renovación, trazabilidad, reportes y documentos.

→ **Universidad: ítem 6 (parte extendida)**

---

### 6. [`modelo-relacional-resumen.md`](modelo-relacional-resumen.md)

Resumen del **modelo relacional**: tablas (`usuarios`, `contratos`, `pagos_canon`, `mantenimientos`, `evento_trazabilidad`, etc.), claves primarias y foráneas, enums PostgreSQL y cardinalidades. Aclara que los reportes no se persisten en tabla dedicada.

→ **Universidad: ítem 3**

---

### 7. [`script-bd-referencia.md`](script-bd-referencia.md)

Guía de los **scripts SQL** del proyecto: propósito, orden de ejecución y verificación (`supabase-schema.sql`, `supabase-seed.sql`, `supabase-storage-setup.sql` en `docs/database/`).

→ **Universidad: ítem 4**

---

### 8. [`diagrama-clases.mmd`](diagrama-clases.mmd)

**Diagrama de clases** en sintaxis Mermaid: entidades del dominio (`Usuario`, `Contrato`, `PagoReportado`, `Mantenimiento`, `ArchivoAdjunto`, etc.) y relaciones principales.

→ **Universidad: ítem 7** (renderizar en Notion, Mermaid Live o exportar a imagen)

---

### 9. [`diagramas-estados.md`](diagramas-estados.md)

**Diagramas de estado** por entidad: Contrato, InvitacionContrato, PagoCanon, PagoServicioPublico, Mantenimiento, NoRenovacion, Notificacion y EventoTrazabilidad. Cada uno con breve explicación.

→ **Universidad: ítem 8**

---

### 10. [`diagramas-secuencia.md`](diagramas-secuencia.md)

**Diagramas de secuencia** (Mermaid) para: crear contrato e invitar, aceptar contrato, pagos de canon, pagos de servicios, mantenimiento, no renovación, carga de documentos y generación de reportes.

→ **Universidad: ítem 10**

---

### 11. [`diagramas-colaboracion.md`](diagramas-colaboracion.md)

**Diagramas de colaboración / comunicación** (flowcharts): procesos de contrato, pago canon, servicios públicos, mantenimiento, no renovación y reportes. Tabla resumen de comunicación entre capas.

→ **Universidad: ítem 9**

---

### 12. [`diagrama-componentes.mmd`](diagrama-componentes.mmd)

**Diagrama de componentes**: navegador, App Router, Server Actions, services, repositories, Firebase Auth, Supabase, Playwright y generación PDF.

→ **Universidad: ítem 11**

---

### 13. [`diagrama-distribucion.mmd`](diagrama-distribucion.mmd)

**Diagrama de distribución / despliegue**: cliente web, hosting Next.js (Vercel o Node local), Firebase, Supabase (PostgreSQL y Storage), GitHub y entorno de pruebas E2E.

→ **Universidad: ítem 12**

---

### 14. [`arquitectura-general.md`](arquitectura-general.md)

Descripción de la **arquitectura técnica**: capas, stack (Next.js, Tailwind, Firebase, Supabase, `@react-pdf/renderer`), patrón services/repositories, modos MOCK/SUPABASE, control de acceso y tabla de módulos ↔ servicios. Facilita el ítem 13 al orientar dónde está cada parte del código en el repositorio.

→ **Universidad: ítem 13 (complemento documental)** · **Tesis: capítulo de diseño**

---

### 15. [`evidencias-pruebas.md`](evidencias-pruebas.md)

**Pruebas E2E** con Playwright: 25 pruebas, rutas validadas, capturas en `test-results/evidencias/`, reporte HTML y limitaciones. Enlaza con `docs/PRUEBAS_E2E.md`.

→ **Tesis: validación / pruebas** (complemento, no sustituye diagramas UML)

---

## Scripts SQL (fuera de esta carpeta, ítem 4)

Los archivos ejecutables referenciados en el manual están en:

| Script | Ruta |
|--------|------|
| Esquema | `docs/database/supabase-schema.sql` |
| Datos demo | `docs/database/supabase-seed.sql` |
| Storage | `docs/database/supabase-storage-setup.sql` |

---

## Cómo usar los diagramas `.mmd`

1. Abrir el archivo en [mermaid.live](https://mermaid.live) y exportar PNG/SVG para la tesis.
2. Pegar el bloque en Notion (bloque Mermaid) o en Markdown compatible.
3. Mantener el `.mmd` en el repo como fuente versionada del diagrama.

---

## Documentación relacionada en el repositorio

| Documento | Ubicación |
|-----------|-----------|
| Arquitectura resumida | `docs/ARQUITECTURA.md` |
| Control de acceso | `docs/access-control.md` |
| Pruebas E2E (operación) | `docs/PRUEBAS_E2E.md` |
| Conexión Supabase | `docs/database/CONEXION_SUPABASE.md` |
| Modelo de datos ampliado | `docs/database/database-model.md` |

---

*Última generación del manual: alineada con el estado del repositorio tras documentación técnica y suite E2E Playwright (25 pruebas).*

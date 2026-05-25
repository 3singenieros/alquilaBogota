# Diagramas de colaboración / comunicación

Se utilizan **flowcharts** con actores y componentes (Mermaid no ofrece diagrama de colaboración UML clásico de forma estándar).

---

## Proceso: Contrato e invitación

```mermaid
flowchart LR
    subgraph Actores
        A[Arrendador]
        B[Arrendatario]
    end
    subgraph Frontend
        MC[contratos-module]
        SC[solicitudes-contrato-module]
    end
    subgraph Backend_app
        CS[contratos.service]
        IS[invitaciones-contrato.service]
        NS[notificaciones.service]
    end
    subgraph Datos
        DB[(PostgreSQL / Mock)]
    end

    A --> MC
    MC --> CS
    CS --> DB
    CS --> IS
    IS --> DB
    IS --> NS
    B --> SC
    SC --> IS
    NS -.simulado.-> B
```

---

## Proceso: Pago de canon

```mermaid
flowchart LR
    AR[Arrendatario] --> PM[pagos-module]
    AD[Arrendador] --> PM
    PM --> PS[pagos.service]
    PS --> PR[pagos.repository]
    PR --> DB[(pagos_canon)]
    PM --> FS[file-storage.service]
    FS --> ST[(Storage pagos)]
    PS --> NS[notificaciones.service]
    PS --> SP[soporte-pago.service]
    SP --> PDF[PDF soporte cliente]
```

---

## Proceso: Servicios públicos

```mermaid
flowchart TB
    AR[Arrendador] --> SM[servicios-module]
    AT[Arrendatario] --> SM
    SM --> SC[servicios-contrato.service]
    SM --> PS[pagos-servicio.service]
    SC --> DB1[(servicios_publicos_contrato)]
    PS --> DB2[(pagos_servicios_publicos)]
    SM --> FS[file-storage.service]
    FS --> ST[(Storage servicios)]
    PS --> AC[access-control.service]
```

---

## Proceso: Mantenimiento

```mermaid
flowchart TB
    U[Usuario] --> MM[mantenimiento-module]
    MM --> MS[mantenimiento.service]
    MM --> ME[mantenimiento-economico.service]
    MS --> MR[mantenimiento.repository]
    MS --> CM[comentarios.repository]
    MR --> DB[(mantenimientos)]
    MM --> FS[file-storage.service]
    FS --> ST[(Storage mantenimiento)]
    MS --> TRZ[trazabilidad.service]
```

---

## Proceso: No renovación

```mermaid
flowchart LR
    U[Arrendador / Arrendatario] --> NR[no-renovacion-module]
    NR --> NRS[no-renovacion.service]
    NRS --> NRR[no-renovacion.repository]
    NRR --> DB[(no_renovaciones)]
    NR --> PDF[no-renovacion-pdf]
    NRS --> CTR[contratos.repository]
    NRS --> FS[file-storage.service]
    FS --> ST[(Storage no-renovacion)]
```

---

## Proceso: Reportes

```mermaid
flowchart TB
    U[Usuario autorizado] --> RM[reportes-module]
    RM --> RS[reportes.service]
    RS --> R1[contratos / pagos / mnt repos]
    RS --> RTS[trazabilidad.service]
    R1 --> DB[(PostgreSQL)]
    RTS --> DB
    RS --> RD[ReporteDocumento DTO]
    RD --> PDF[@react-pdf/renderer]
    PDF --> U
```

## Comunicación entre capas (resumen)

| Origen | Destino | Protocolo |
|--------|---------|-----------|
| Navegador | Next.js App Router | HTTPS |
| Server Actions | Services | Llamada función TS |
| Services | Repositories | Interface TypeScript |
| Repositories Supabase | PostgreSQL | Supabase JS client |
| file-storage.service | Storage | Supabase Storage API |
| Login producción | Firebase Auth | SDK / OAuth |
| Login E2E | `/api/e2e/login` | HTTP POST + cookie |

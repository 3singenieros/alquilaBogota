import type {
  ActividadReciente,
  Contrato,
  Incidencia,
  Inmueble,
  Mantenimiento,
  NoRenovacion,
  PagoReportado,
  ServicioPublico,
  Usuario,
} from "@/types";

export const seedUsuarios: Usuario[] = [
  {
    id: "u-admin",
    nombre: "Ana Administradora",
    email: "admin@demo.edu",
    rol: "ADMIN",
    telefono: "3001110001",
    activo: true,
    creadoEn: "2025-01-10",
  },
  {
    id: "u-arrendador",
    nombre: "Carlos Arrendador",
    email: "arrendador@demo.edu",
    rol: "ARRENDADOR",
    telefono: "3001110002",
    activo: true,
    creadoEn: "2025-01-10",
  },
  {
    id: "u-arrendatario",
    nombre: "María Arrendataria",
    email: "arrendatario@demo.edu",
    rol: "ARRENDATARIO",
    telefono: "3001110003",
    activo: true,
    creadoEn: "2025-02-01",
  },
  {
    id: "u-arrendador-2",
    nombre: "Luis Propietario",
    email: "luis@demo.edu",
    rol: "ARRENDADOR",
    activo: true,
    creadoEn: "2025-03-15",
  },
];

export const seedInmuebles: Inmueble[] = [
  {
    id: "inm-1",
    titulo: "Apartamento Centro",
    direccion: "Calle 45 #12-30",
    ciudad: "Bogotá",
    tipo: "Apartamento",
    estado: "ARRENDADO",
    canonMensual: 1800000,
    arrendadorId: "u-arrendador",
    descripcion: "2 habitaciones, balcón",
    creadoEn: "2025-01-15",
  },
  {
    id: "inm-2",
    titulo: "Local Comercial Norte",
    direccion: "Av. 68 #25-10",
    ciudad: "Bogotá",
    tipo: "Local",
    estado: "ARRENDADO",
    canonMensual: 3200000,
    arrendadorId: "u-arrendador",
    creadoEn: "2025-02-01",
  },
  {
    id: "inm-3",
    titulo: "Casa Campestre",
    direccion: "Km 5 Vía Chía",
    ciudad: "Chía",
    tipo: "Casa",
    estado: "DISPONIBLE",
    canonMensual: 4500000,
    arrendadorId: "u-arrendador-2",
    creadoEn: "2025-04-01",
  },
];

export const seedContratos: Contrato[] = [
  {
    id: "ctr-1",
    inmuebleId: "inm-1",
    arrendatarioId: "u-arrendatario",
    arrendadorId: "u-arrendador",
    fechaInicio: "2025-02-01",
    fechaFin: "2026-01-31",
    canonMensual: 1800000,
    estado: "ACTIVO",
    documentoUrl: "/docs/contrato-1.pdf",
    creadoEn: "2025-01-28",
  },
  {
    id: "ctr-2",
    inmuebleId: "inm-2",
    arrendatarioId: "u-arrendatario",
    arrendadorId: "u-arrendador",
    fechaInicio: "2024-06-01",
    fechaFin: "2025-05-31",
    canonMensual: 3200000,
    estado: "ACTIVO",
    creadoEn: "2024-05-20",
  },
];

export const seedPagos: PagoReportado[] = [
  {
    id: "pag-1",
    contratoId: "ctr-1",
    mes: "2025-04",
    monto: 1800000,
    fechaReporte: "2025-04-03",
    estado: "VALIDADO",
    comprobanteUrl: "/comprobantes/pag-1.pdf",
    reportadoPorId: "u-arrendatario",
  },
  {
    id: "pag-2",
    contratoId: "ctr-1",
    mes: "2025-05",
    monto: 1800000,
    fechaReporte: "2025-05-02",
    estado: "REPORTADO",
    reportadoPorId: "u-arrendatario",
  },
  {
    id: "pag-3",
    contratoId: "ctr-2",
    mes: "2025-05",
    monto: 3200000,
    fechaReporte: "2025-05-05",
    estado: "REPORTADO",
    reportadoPorId: "u-arrendatario",
  },
];

export const seedServicios: ServicioPublico[] = [
  {
    id: "srv-1",
    inmuebleId: "inm-1",
    tipo: "Agua",
    periodo: "2025-04",
    monto: 85000,
    vencimiento: "2025-04-20",
    estado: "PAGADO",
  },
  {
    id: "srv-2",
    inmuebleId: "inm-1",
    tipo: "Energía",
    periodo: "2025-05",
    monto: 120000,
    vencimiento: "2025-05-18",
    estado: "PENDIENTE",
  },
  {
    id: "srv-3",
    inmuebleId: "inm-2",
    tipo: "Gas",
    periodo: "2025-05",
    monto: 95000,
    vencimiento: "2025-05-10",
    estado: "VENCIDO",
  },
];

export const seedMantenimiento: Mantenimiento[] = [
  {
    id: "mnt-1",
    inmuebleId: "inm-1",
    titulo: "Fuga en lavamanos",
    descripcion: "Goteo constante en baño principal",
    prioridad: "ALTA",
    estado: "EN_PROGRESO",
    solicitadoPorId: "u-arrendatario",
    asignadoA: "Plomería Express",
    creadoEn: "2025-05-10",
  },
  {
    id: "mnt-2",
    inmuebleId: "inm-2",
    titulo: "Pintura fachada",
    descripcion: "Retoque zona frontal del local",
    prioridad: "BAJA",
    estado: "ABIERTO",
    solicitadoPorId: "u-arrendador",
    creadoEn: "2025-05-12",
  },
];

export const seedNoRenovacion: NoRenovacion[] = [
  {
    id: "nr-1",
    contratoId: "ctr-2",
    motivo: "Cambio de ciudad por trabajo",
    fechaSolicitud: "2025-05-01",
    estado: "EN_REVISION",
    solicitadoPorId: "u-arrendatario",
  },
];

export const seedActividad: ActividadReciente[] = [
  {
    id: "act-1",
    tipo: "pago",
    descripcion: "Pago de mayo reportado — Apartamento Centro",
    fecha: "2025-05-02",
    modulo: "Pagos",
  },
  {
    id: "act-2",
    tipo: "mantenimiento",
    descripcion: "Incidencia asignada a proveedor",
    fecha: "2025-05-11",
    modulo: "Mantenimiento",
  },
  {
    id: "act-3",
    tipo: "contrato",
    descripcion: "Contrato local comercial próximo a vencer",
    fecha: "2025-05-08",
    modulo: "Contratos",
  },
];

export const seedIncidencias: Incidencia[] = [
  {
    id: "inc-1",
    titulo: "Servicio de gas vencido",
    severidad: "error",
    modulo: "Servicios públicos",
    fecha: "2025-05-10",
  },
  {
    id: "inc-2",
    titulo: "2 pagos pendientes de validación",
    severidad: "warning",
    modulo: "Pagos",
    fecha: "2025-05-12",
  },
  {
    id: "inc-3",
    titulo: "Solicitud de no renovación en revisión",
    severidad: "info",
    modulo: "No renovación",
    fecha: "2025-05-01",
  },
];

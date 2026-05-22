export type Rol = "ADMIN" | "ARRENDADOR" | "ARRENDATARIO";

export type EstadoContrato = "ACTIVO" | "VENCIDO" | "PENDIENTE" | "TERMINADO";
export type EstadoInmueble = "DISPONIBLE" | "ARRENDADO" | "MANTENIMIENTO";
export type EstadoPago = "REPORTADO" | "VALIDADO" | "RECHAZADO";
export type EstadoServicio = "PENDIENTE" | "PAGADO" | "VENCIDO";
export type EstadoMantenimiento = "ABIERTO" | "EN_PROGRESO" | "RESUELTO" | "CERRADO";
export type EstadoNoRenovacion = "SOLICITADA" | "EN_REVISION" | "ACEPTADA" | "RECHAZADA";

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  telefono?: string;
  activo: boolean;
  creadoEn: string;
}

export interface Inmueble {
  id: string;
  titulo: string;
  direccion: string;
  ciudad: string;
  tipo: string;
  estado: EstadoInmueble;
  canonMensual: number;
  arrendadorId: string;
  descripcion?: string;
  creadoEn: string;
}

export interface Contrato {
  id: string;
  inmuebleId: string;
  arrendatarioId: string;
  arrendadorId: string;
  fechaInicio: string;
  fechaFin: string;
  canonMensual: number;
  estado: EstadoContrato;
  documentoUrl?: string;
  creadoEn: string;
}

export interface PagoReportado {
  id: string;
  contratoId: string;
  mes: string;
  monto: number;
  fechaReporte: string;
  estado: EstadoPago;
  comprobanteUrl?: string;
  notas?: string;
  reportadoPorId: string;
}

export interface ServicioPublico {
  id: string;
  inmuebleId: string;
  tipo: string;
  periodo: string;
  monto: number;
  vencimiento: string;
  estado: EstadoServicio;
  comprobanteUrl?: string;
}

export interface Mantenimiento {
  id: string;
  inmuebleId: string;
  titulo: string;
  descripcion: string;
  prioridad: "BAJA" | "MEDIA" | "ALTA";
  estado: EstadoMantenimiento;
  solicitadoPorId: string;
  asignadoA?: string;
  creadoEn: string;
  adjuntoUrl?: string;
}

export interface NoRenovacion {
  id: string;
  contratoId: string;
  motivo: string;
  fechaSolicitud: string;
  estado: EstadoNoRenovacion;
  documentoUrl?: string;
  solicitadoPorId: string;
}

export interface ActividadReciente {
  id: string;
  tipo: string;
  descripcion: string;
  fecha: string;
  modulo: string;
}

export interface Incidencia {
  id: string;
  titulo: string;
  severidad: "info" | "warning" | "error";
  modulo: string;
  fecha: string;
}

export type CreateInput<T extends { id: string }> = Omit<T, "id" | "creadoEn"> &
  (T extends { creadoEn: string } ? Partial<Pick<T, "creadoEn">> : object);
export type UpdateInput<T extends { id: string }> = Partial<Omit<T, "id">>;

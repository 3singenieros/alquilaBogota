export type Rol = "ADMIN" | "ARRENDADOR" | "ARRENDATARIO";

export type EstadoContrato =
  | "BORRADOR"
  | "PENDIENTE_CONFIRMACION"
  | "CONFIRMADO"
  | "RECHAZADO"
  | "CANCELADO"
  | "TERMINADO"
  | "VENCIDO";

export type EstadoInvitacionContrato = "PENDIENTE" | "ACEPTADA" | "RECHAZADA" | "EXPIRADA";
export type EstadoInmueble = "DISPONIBLE" | "ARRENDADO" | "MANTENIMIENTO";
export type EstadoPago = "REPORTADO" | "VALIDADO" | "RECHAZADO";
export type TipoServicioPublico =
  | "ENERGIA"
  | "AGUA"
  | "GAS"
  | "INTERNET"
  | "ADMINISTRACION"
  | "OTRO";

export type PeriodicidadServicio = "MENSUAL" | "BIMESTRAL";

export type EstadoPagoServicioPublico =
  | "PENDIENTE"
  | "REPORTADO"
  | "VALIDADO"
  | "RECHAZADO"
  | "VENCIDO";
export type EstadoMantenimiento =
  | "ABIERTO"
  | "EN_GESTION"
  | "RESUELTO"
  | "CERRADO"
  | "RECHAZADO";
export type EstadoNoRenovacion = "SOLICITADA" | "EN_REVISION" | "ACEPTADA" | "RECHAZADA";
export type EstadoDepositoGarantia = "PENDIENTE" | "DEVUELTO" | "APLICADO";
export type EstadoNotificacion = "PENDIENTE" | "SIMULADA" | "ERROR";
export type EstadoNotificacionEnvio = "PENDIENTE" | "SIMULADA" | "ERROR";

export type TipoNotificacion =
  | "INVITACION_CONTRATO"
  | "CONTRATO_ACEPTADO"
  | "CONTRATO_RECHAZADO"
  | "CONTRATO_PROXIMO_VENCER"
  | "NO_RENOVACION"
  | "PAGO_REPORTADO"
  | "PAGO_VALIDADO"
  | "PAGO_RECHAZADO"
  | "PAGO_SERVICIO_REPORTADO"
  | "PAGO_SERVICIO_VALIDADO"
  | "PAGO_SERVICIO_RECHAZADO"
  | "PAGO_SERVICIO_VENCIDO"
  | "MANTENIMIENTO_CREADO"
  | "MANTENIMIENTO_ESTADO_CAMBIADO"
  | "MANTENIMIENTO_COMENTARIO"
  | "MANTENIMIENTO_CERRADO"
  | "REAJUSTE_CANON";

export interface Usuario {
  id: string;
  code: string;
  nombre: string;
  email: string;
  /** Rol activo en la sesión (alias de rolActivo). */
  rol: Rol;
  roles: Rol[];
  rolActivo: Rol;
  telefono?: string;
  activo: boolean;
  creadoEn: string;
  photoURL?: string;
  perfilCompletado: boolean;
  firebaseUid?: string;
}

export interface Inmueble {
  id: string;
  code: string;
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
  code: string;
  inmuebleId: string;
  arrendatarioId: string;
  emailArrendatario: string;
  nombreArrendatario?: string;
  arrendadorId: string;
  fechaInicio: string;
  fechaFin: string;
  canonActual: number;
  canonAnterior: number;
  porcentajeReajuste: number;
  fechaUltimoReajuste?: string;
  estado: EstadoContrato;
  documentoUrl?: string;
  codeudorNombre?: string;
  codeudorDocumento?: string;
  codeudorTelefono?: string;
  codeudorEmail?: string;
  depositoGarantiaValor: number;
  depositoGarantiaEstado: EstadoDepositoGarantia;
  prorrogaAutomatica: boolean;
  fechaLimitePreaviso: string;
  inventarioEntrega: string;
  observacionesEntrega?: string;
  motivoRechazo?: string;
  creadoEn: string;
}

export interface InvitacionContrato {
  id: string;
  contratoId: string;
  emailInvitado: string;
  nombreInvitado?: string;
  estado: EstadoInvitacionContrato;
  tokenInvitacion: string;
  fechaCreacion: string;
  fechaRespuesta?: string;
  motivoRechazo?: string;
}

export interface PagoReportado {
  id: string;
  code: string;
  contratoId: string;
  mes: string;
  monto: number;
  fechaReporte: string;
  estado: EstadoPago;
  comprobanteUrl?: string;
  notas?: string;
  medioPago?: string;
  reportadoPorId: string;
  fechaValidacion?: string;
  validadoPorId?: string;
  rechazadoPorId?: string;
  motivoRechazo?: string;
  soportePagoId?: string;
}

/** Servicio base configurado en el contrato (arrendador). */
export interface ServicioPublicoContrato {
  id: string;
  code: string;
  contratoId: string;
  inmuebleId: string;
  tipoServicio: TipoServicioPublico;
  empresaPrestadora: string;
  numeroCuentaServicio: string;
  periodicidad: PeriodicidadServicio;
  activo: boolean;
  observaciones?: string;
}

/** Pago periódico reportado por el arrendatario y validado por el arrendador. */
export interface PagoServicioPublico {
  id: string;
  code: string;
  servicioPublicoContratoId: string;
  contratoId: string;
  inmuebleId: string;
  periodo: string;
  fechaPago: string;
  fechaReporte: string;
  fechaVencimiento: string;
  valorPagado: number;
  estado: EstadoPagoServicioPublico;
  comprobanteUrl?: string;
  reportadoPorId: string;
  validadoPorId?: string;
  fechaValidacion?: string;
  motivoRechazo?: string;
  observaciones?: string;
}

export interface Mantenimiento {
  id: string;
  code: string;
  inmuebleId: string;
  titulo: string;
  descripcion: string;
  prioridad: "BAJA" | "MEDIA" | "ALTA";
  estado: EstadoMantenimiento;
  solicitadoPorId: string;
  asignadoA?: string;
  observacionesGestion?: string;
  creadoEn: string;
  fechaCierre?: string;
  adjuntoUrl?: string;
}

export interface ComentarioMantenimiento {
  id: string;
  mantenimientoId: string;
  contratoId?: string;
  inmuebleId: string;
  usuarioId: string;
  usuarioNombre: string;
  usuarioEmail: string;
  usuarioRol: Rol;
  comentario: string;
  adjuntoUrl?: string;
  fechaCreacion: string;
}

export interface NoRenovacion {
  id: string;
  code: string;
  contratoId: string;
  motivo: string;
  fechaSolicitud: string;
  estado: EstadoNoRenovacion;
  documentoUrl?: string;
  solicitadoPorId: string;
  fechaLimitePreaviso: string;
  fechaEnvioNotificacion?: string;
  destinatarioArrendadorEmail: string;
  destinatarioArrendatarioEmail: string;
  estadoNotificacion: EstadoNotificacionEnvio;
  observacionesNotificacion?: string;
}

export interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  contratoId?: string;
  destinatarioNombre: string;
  destinatarioEmail: string;
  rolDestinatario: Rol;
  asunto: string;
  mensaje: string;
  estado: EstadoNotificacion;
  fechaCreacion: string;
  fechaEnvioSimulado?: string;
  referenciaModulo: string;
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

export type CreateInput<T extends { id: string }> = Omit<T, "id" | "code" | "creadoEn"> &
  (T extends { creadoEn: string } ? Partial<Pick<T, "creadoEn">> : object);
export type UpdateInput<T extends { id: string }> = Partial<Omit<T, "id" | "code">>;

import type { Rol } from "@/types";

export type EntidadTipoTrazabilidad =
  | "CONTRATO"
  | "INMUEBLE"
  | "PAGO"
  | "SERVICIO_PUBLICO"
  | "PAGO_SERVICIO_PUBLICO"
  | "MANTENIMIENTO"
  | "NO_RENOVACION"
  | "NOTIFICACION"
  | "USUARIO"
  | "SOPORTE_PAGO"
  | "INVITACION_CONTRATO";

export type AccionTrazabilidad =
  | "CREADO"
  | "ACTUALIZADO"
  | "ELIMINADO"
  | "ESTADO_CAMBIADO"
  | "DOCUMENTO_ADJUNTADO"
  | "DOCUMENTO_ELIMINADO"
  | "INVITACION_ENVIADA"
  | "CONTRATO_ACEPTADO"
  | "CONTRATO_RECHAZADO"
  | "CANON_MODIFICADO"
  | "REAJUSTE_CANON_APLICADO"
  | "PAGO_REPORTADO"
  | "PAGO_VALIDADO"
  | "PAGO_RECHAZADO"
  | "SOPORTE_GENERADO"
  | "SERVICIO_CONTRATO_CREADO"
  | "SERVICIO_CONTRATO_ACTUALIZADO"
  | "SERVICIO_CONTRATO_INACTIVADO"
  | "PAGO_SERVICIO_REPORTADO"
  | "PAGO_SERVICIO_VALIDADO"
  | "PAGO_SERVICIO_RECHAZADO"
  | "PAGO_SERVICIO_VENCIDO"
  | "MANTENIMIENTO_CREADO"
  | "MANTENIMIENTO_ACTUALIZADO"
  | "MANTENIMIENTO_ESTADO_CAMBIADO"
  | "MANTENIMIENTO_COMENTARIO_AGREGADO"
  | "MANTENIMIENTO_EVIDENCIA_ADJUNTADA"
  | "MANTENIMIENTO_RESUELTO"
  | "MANTENIMIENTO_CERRADO"
  | "MANTENIMIENTO_RECHAZADO"
  | "MANTENIMIENTO_RESPONSABILIDAD_DEFINIDA"
  | "MANTENIMIENTO_RESPONSABILIDAD_ACEPTADA"
  | "MANTENIMIENTO_RESPONSABILIDAD_RECHAZADA"
  | "MANTENIMIENTO_VALOR_ESTIMADO_REGISTRADO"
  | "MANTENIMIENTO_VALOR_FINAL_REGISTRADO"
  | "NO_RENOVACION_SOLICITADA"
  | "NO_RENOVACION_CREADA"
  | "NO_RENOVACION_DOCUMENTO_GENERADO"
  | "NO_RENOVACION_PDF_DESCARGADO"
  | "NO_RENOVACION_ENVIO_REGISTRADO"
  | "CONTRATO_MARCADO_NO_RENOVAR"
  | "NO_RENOVACION_NOTIFICADA"
  | "NOTIFICACION_CREADA"
  | "NOTIFICACION_SIMULADA"
  | "ONBOARDING_COMPLETADO"
  | "ROL_ACTIVO_CAMBIADO"
  | "ROL_AGREGADO"
  | "REPORTE_GENERADO"
  | "ACCESO_DENEGADO"
  | "PERFIL_ACTUALIZADO"
  | "INMUEBLE_ACTUALIZADO";

export type RolAuditoria = Rol | "SISTEMA";

export interface EventoTrazabilidad {
  id: string;
  entidadTipo: EntidadTipoTrazabilidad;
  entidadId: string;
  contratoId?: string;
  inmuebleId?: string;
  pagoId?: string;
  usuarioAfectadoId?: string;
  accion: AccionTrazabilidad;
  estadoAnterior?: string;
  estadoNuevo?: string;
  descripcion: string;
  usuarioId: string;
  usuarioNombre: string;
  usuarioEmail: string;
  usuarioRol: RolAuditoria;
  fechaHora: string;
  valoresAnteriores?: Record<string, unknown>;
  valoresNuevos?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export type RegistrarEventoInput = Omit<
  EventoTrazabilidad,
  "id" | "fechaHora" | "usuarioId" | "usuarioNombre" | "usuarioEmail" | "usuarioRol"
> & {
  usuarioId?: string;
  usuarioNombre?: string;
  usuarioEmail?: string;
  usuarioRol?: RolAuditoria;
};

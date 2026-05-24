import type { DatosFormalesContrato, DatosParteFormal } from "@/lib/contrato-datos-formales";
import { formatInmuebleDireccionCompleta, formatInmuebleUbicacion } from "@/lib/inmueble-ubicacion";
import { generarTextoNoRenovacion } from "@/lib/no-renovacion-texto";
import type { Contrato, Inmueble, NoRenovacion, Rol, Usuario } from "@/types";

export type RolManifestante = "ARRENDADOR" | "ARRENDATARIO";

export function rolManifestanteDesdeUsuario(
  usuario: Usuario,
  override?: RolManifestante
): RolManifestante {
  if (override) return override;
  if (usuario.rol === "ARRENDADOR" || usuario.rolActivo === "ARRENDADOR") {
    return "ARRENDADOR";
  }
  if (usuario.rol === "ARRENDATARIO" || usuario.rolActivo === "ARRENDATARIO") {
    return "ARRENDATARIO";
  }
  return "ARRENDADOR";
}

function parteARol(
  manifestante: RolManifestante,
  datos: DatosFormalesContrato
): { remitente: DatosParteFormal; destinatario: DatosParteFormal } {
  if (manifestante === "ARRENDADOR") {
    return { remitente: datos.arrendador, destinatario: datos.arrendatario };
  }
  return { remitente: datos.arrendatario, destinatario: datos.arrendador };
}

export function construirCamposPartes(
  manifestante: RolManifestante,
  datos: DatosFormalesContrato
): Pick<
  NoRenovacion,
  | "destinatarioNombre"
  | "destinatarioEmail"
  | "destinatarioTipoDocumento"
  | "destinatarioNumeroDocumento"
  | "destinatarioDireccionNotificacion"
  | "remitenteNombre"
  | "remitenteEmail"
  | "remitenteTipoDocumento"
  | "remitenteNumeroDocumento"
  | "remitenteDireccionNotificacion"
> {
  const { remitente, destinatario } = parteARol(manifestante, datos);
  return {
    remitenteNombre: remitente.nombre,
    remitenteEmail: remitente.correoNotificaciones,
    remitenteTipoDocumento: remitente.tipoDocumento,
    remitenteNumeroDocumento: remitente.numeroDocumento,
    remitenteDireccionNotificacion: remitente.direccionNotificaciones || undefined,
    destinatarioNombre: destinatario.nombre,
    destinatarioEmail: destinatario.correoNotificaciones,
    destinatarioTipoDocumento: destinatario.tipoDocumento,
    destinatarioNumeroDocumento: destinatario.numeroDocumento,
    destinatarioDireccionNotificacion: destinatario.direccionNotificaciones || undefined,
  };
}

export function inferirManifestante(expediente: NoRenovacion): RolManifestante {
  if (expediente.iniciadoPorRol === "ARRENDADOR") return "ARRENDADOR";
  if (expediente.iniciadoPorRol === "ARRENDATARIO") return "ARRENDATARIO";
  return "ARRENDADOR";
}

export function textoComunicacionDesdeExpediente(
  expediente: NoRenovacion,
  contrato: Contrato,
  inmueble: Inmueble
): string {
  return generarTextoNoRenovacion({
    ciudad: formatInmuebleUbicacion(inmueble),
    fechaCarta: new Date().toISOString().slice(0, 10),
    remitenteNombre: expediente.remitenteNombre,
    remitenteTipoDocumento: expediente.remitenteTipoDocumento,
    remitenteNumeroDocumento: expediente.remitenteNumeroDocumento,
    remitenteEmail: expediente.remitenteEmail,
    remitenteDireccion: expediente.remitenteDireccionNotificacion,
    destinatarioNombre: expediente.destinatarioNombre,
    destinatarioTipoDocumento: expediente.destinatarioTipoDocumento,
    destinatarioNumeroDocumento: expediente.destinatarioNumeroDocumento,
    destinatarioEmail: expediente.destinatarioEmail,
    destinatarioDireccion: expediente.destinatarioDireccionNotificacion,
    codigoContrato: contrato.code,
    inmuebleDireccion: formatInmuebleDireccionCompleta(inmueble),
    fechaInicio: contrato.fechaInicio,
    fechaFin: contrato.fechaFin,
    fechaLimitePreaviso: expediente.fechaLimitePreaviso,
    motivo: expediente.motivo,
    observaciones: expediente.observaciones,
  });
}

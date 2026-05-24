import type { Contrato, Inmueble, Rol, Usuario } from "@/types";

export type DatosParteFormal = {
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  correoNotificaciones: string;
  direccionNotificaciones: string;
};

export type DatosFormalesContrato = {
  arrendador: DatosParteFormal;
  arrendatario: DatosParteFormal;
  faltantes: string[];
};

const CAMPOS_PARTE: (keyof DatosParteFormal)[] = [
  "nombre",
  "tipoDocumento",
  "numeroDocumento",
  "correoNotificaciones",
  "direccionNotificaciones",
];

function faltantesParte(prefijo: string, parte: DatosParteFormal): string[] {
  const out: string[] = [];
  for (const key of CAMPOS_PARTE) {
    if (!parte[key]?.trim()) {
      out.push(`${prefijo}: ${key}`);
    }
  }
  return out;
}

export function datosFormalesDesdeContrato(
  contrato: Contrato,
  inmueble: Inmueble | null,
  arrendador: Usuario | undefined,
  arrendatario: Usuario | undefined
): DatosFormalesContrato {
  const arrendadorDatos: DatosParteFormal = {
    nombre: contrato.nombreArrendador ?? arrendador?.nombre ?? "",
    tipoDocumento: contrato.tipoDocumentoArrendador ?? "CC",
    numeroDocumento: contrato.numeroDocumentoArrendador ?? "",
    correoNotificaciones:
      contrato.correoNotificacionesArrendador ?? arrendador?.email ?? "",
    direccionNotificaciones:
      contrato.direccionNotificacionesArrendador ??
      (inmueble ? `${inmueble.direccion}, ${inmueble.ciudad}` : ""),
  };

  const arrendatarioDatos: DatosParteFormal = {
    nombre: contrato.nombreArrendatario ?? arrendatario?.nombre ?? "",
    tipoDocumento: contrato.tipoDocumentoArrendatario ?? "CC",
    numeroDocumento: contrato.numeroDocumentoArrendatario ?? "",
    correoNotificaciones:
      contrato.correoNotificacionesArrendatario ?? contrato.emailArrendatario ?? "",
    direccionNotificaciones: contrato.direccionNotificacionesArrendatario ?? "",
  };

  const faltantes = [
    ...faltantesParte("Arrendador", arrendadorDatos),
    ...faltantesParte("Arrendatario", arrendatarioDatos),
  ];

  if (!contrato.fechaFin) faltantes.push("Contrato: fechaFin");
  if (!inmueble?.direccion) faltantes.push("Inmueble: dirección");

  return { arrendador: arrendadorDatos, arrendatario: arrendatarioDatos, faltantes };
}

export function estaDentroPlazoPreaviso(
  fechaLimitePreaviso: string | undefined,
  hoy = new Date()
): boolean {
  if (!fechaLimitePreaviso?.trim()) return false;
  const limite = new Date(fechaLimitePreaviso + "T23:59:59");
  return hoy <= limite;
}

export function rolEsParteContrato(rol: Rol, contrato: Contrato, usuarioId: string): boolean {
  if (rol === "ADMIN") return true;
  if (rol === "ARRENDADOR") return contrato.arrendadorId === usuarioId;
  if (rol === "ARRENDATARIO") return contrato.arrendatarioId === usuarioId;
  return false;
}

import type { NoRenovacion } from "@/types";

export type NoRenovacionPdfData = {
  expediente: NoRenovacion;
  ciudad: string;
  inmuebleDireccion: string;
  codigoContrato: string;
};

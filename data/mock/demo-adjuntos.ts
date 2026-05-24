import type { ArchivoAdjunto } from "@/types";

const base = (partial: Omit<ArchivoAdjunto, "fechaCarga"> & { fechaCarga?: string }): ArchivoAdjunto => ({
  fechaCarga: partial.fechaCarga ?? "2026-05-01T10:00:00.000Z",
  ...partial,
});

export const demoAdjuntoContratoFirmado: ArchivoAdjunto = base({
  id: "adj-ctr-1",
  nombre: "contrato-firmado.pdf",
  tipo: "application/pdf",
  tamano: 245000,
  urlSimulada: "archivo:contrato-firmado.pdf",
  descripcion: "Contrato firmado",
  cargadoPorId: "u-arrendador",
  cargadoPorNombre: "Carlos Arrendador",
  cargadoPorEmail: "arrendador@demo.edu",
  cargadoPorRol: "ARRENDADOR",
});

export const demoAdjuntoCedulaArrendatario: ArchivoAdjunto = base({
  id: "adj-ctr-2",
  nombre: "cedula-arrendataria.pdf",
  tipo: "application/pdf",
  tamano: 120000,
  urlSimulada: "archivo:cedula-arrendataria.pdf",
  descripcion: "Cédula arrendataria",
  cargadoPorId: "u-arrendador",
  cargadoPorNombre: "Carlos Arrendador",
  cargadoPorEmail: "arrendador@demo.edu",
  cargadoPorRol: "ARRENDADOR",
});

export const demoAdjuntoComprobantePago: ArchivoAdjunto = base({
  id: "adj-pag-1",
  nombre: "comprobante-mayo.jpg",
  tipo: "image/jpeg",
  tamano: 89000,
  urlSimulada: "archivo:comprobante-mayo.jpg",
  cargadoPorId: "u-arrendatario",
  cargadoPorNombre: "María Arrendataria",
  cargadoPorEmail: "arrendatario@demo.edu",
  cargadoPorRol: "ARRENDATARIO",
});

export const demoAdjuntoComprobanteServicio: ArchivoAdjunto = base({
  id: "adj-psv-1",
  nombre: "recibo-internet-mayo.pdf",
  tipo: "application/pdf",
  tamano: 56000,
  urlSimulada: "archivo:recibo-internet-mayo.pdf",
  cargadoPorId: "u-arrendatario",
  cargadoPorNombre: "María Arrendataria",
  cargadoPorEmail: "arrendatario@demo.edu",
  cargadoPorRol: "ARRENDATARIO",
});

export const demoAdjuntoEvidenciaFuga: ArchivoAdjunto = base({
  id: "adj-mnt-1",
  nombre: "foto-fuga.jpg",
  tipo: "image/jpeg",
  tamano: 210000,
  urlSimulada: "archivo:foto-fuga.jpg",
  descripcion: "Evidencia inicial",
  cargadoPorId: "u-arrendatario",
  cargadoPorNombre: "María Arrendataria",
  cargadoPorEmail: "arrendatario@demo.edu",
  cargadoPorRol: "ARRENDATARIO",
});

export const demoAdjuntoCierrePuerta: ArchivoAdjunto = base({
  id: "adj-mnt-cierre-1",
  nombre: "acta-cierre-puerta.pdf",
  tipo: "application/pdf",
  tamano: 98000,
  urlSimulada: "archivo:acta-cierre-puerta.pdf",
  descripcion: "Acta de cierre",
  cargadoPorId: "u-arrendador",
  cargadoPorNombre: "Carlos Arrendador",
  cargadoPorEmail: "arrendador@demo.edu",
  cargadoPorRol: "ARRENDADOR",
  fechaCarga: "2026-05-15T16:00:00.000Z",
});

export const demoAdjuntoGuiaCorreoCertificado: ArchivoAdjunto = base({
  id: "adj-nr-guia-1",
  nombre: "guia-correo-certificado-4-72.pdf",
  tipo: "application/pdf",
  tamano: 52000,
  urlSimulada: "archivo:guia-correo-certificado-4-72.pdf",
  descripcion: "Guía correo certificado 4-72",
  cargadoPorId: "u-arrendatario",
  cargadoPorNombre: "María Arrendataria",
  cargadoPorEmail: "arrendatario@demo.edu",
  cargadoPorRol: "ARRENDATARIO",
  fechaCarga: "2026-05-16T10:00:00.000Z",
});

export const demoAdjuntoNoRenovacion: ArchivoAdjunto = base({
  id: "adj-nr-1",
  nombre: "carta-no-renovacion.pdf",
  tipo: "application/pdf",
  tamano: 77000,
  urlSimulada: "archivo:carta-no-renovacion.pdf",
  cargadoPorId: "u-arrendatario",
  cargadoPorNombre: "María Arrendataria",
  cargadoPorEmail: "arrendatario@demo.edu",
  cargadoPorRol: "ARRENDATARIO",
});

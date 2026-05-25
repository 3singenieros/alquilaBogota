"use client";

import type { ArchivoAdjunto } from "@/types";
import { Download, ExternalLink, FileSpreadsheet, FileText } from "lucide-react";

function isPdf(tipo?: string, nombre?: string) {
  return tipo === "application/pdf" || nombre?.toLowerCase().endsWith(".pdf");
}

function isImage(tipo?: string, nombre?: string) {
  if (tipo?.startsWith("image/")) return true;
  const n = nombre?.toLowerCase() ?? "";
  return n.endsWith(".png") || n.endsWith(".jpg") || n.endsWith(".jpeg") || n.endsWith(".webp");
}

function isWord(tipo?: string, nombre?: string) {
  return (
    tipo === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    nombre?.toLowerCase().endsWith(".docx")
  );
}

function isExcel(tipo?: string, nombre?: string) {
  return (
    tipo === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    nombre?.toLowerCase().endsWith(".xlsx")
  );
}

function formatBytes(size?: number) {
  if (size === undefined) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentViewer({
  archivo,
  url,
}: {
  archivo: ArchivoAdjunto;
  url: string | null;
}) {
  if (!url) {
    return (
      <div
        data-testid="document-viewer"
        className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
      >
        No se pudo obtener la URL del archivo. Verifique Storage y permisos.
      </div>
    );
  }

  if (isPdf(archivo.tipo, archivo.nombre)) {
    return (
      <iframe
        data-testid="document-viewer"
        title={archivo.nombre}
        src={url}
        className="h-[70vh] w-full rounded-lg border border-[var(--border)] bg-white"
      />
    );
  }

  if (isImage(archivo.tipo, archivo.nombre)) {
    return (
      <div className="flex justify-center rounded-lg border border-[var(--border)] bg-slate-50 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={archivo.nombre} className="max-h-[70vh] max-w-full object-contain" />
      </div>
    );
  }

  const Icon = isExcel(archivo.tipo, archivo.nombre)
    ? FileSpreadsheet
    : isWord(archivo.tipo, archivo.nombre)
      ? FileText
      : FileText;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-slate-50 p-6 text-center">
      <Icon className="mx-auto mb-3 h-12 w-12 text-indigo-500" />
      <p className="font-medium text-slate-800">{archivo.nombre}</p>
      <p className="mt-1 text-sm text-slate-500">
        {archivo.tipo || "Documento"} · {formatBytes(archivo.tamano)}
      </p>
      <p className="mt-2 text-xs text-slate-500">
        Vista previa no disponible para este tipo. Descargue o abra el archivo.
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <a
          href={url}
          download={archivo.nombre}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Download className="mr-1 h-4 w-4" /> Descargar
        </a>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <ExternalLink className="mr-1 h-4 w-4" /> Abrir
        </a>
      </div>
    </div>
  );
}

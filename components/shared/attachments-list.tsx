"use client";

import {
  eliminarArchivoAction,
  obtenerUrlArchivoAction,
} from "@/app/actions/file-storage.actions";
import { DocumentViewer } from "@/components/shared/document-viewer";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";
import type { ArchivoAdjunto } from "@/types";
import type { EntidadTipoTrazabilidad } from "@/types/trazabilidad";
import {
  Download,
  Eye,
  FileImage,
  FileSpreadsheet,
  FileText,
  Paperclip,
  Trash2,
} from "lucide-react";
import { useState, useTransition } from "react";

function formatBytes(size?: number): string {
  if (size === undefined) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function iconoArchivo(archivo: ArchivoAdjunto) {
  const tipo = archivo.tipo ?? "";
  const nombre = archivo.nombre.toLowerCase();
  if (tipo.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(nombre)) {
    return FileImage;
  }
  if (
    tipo.includes("spreadsheet") ||
    nombre.endsWith(".xlsx") ||
    nombre.endsWith(".xls")
  ) {
    return FileSpreadsheet;
  }
  if (tipo.includes("word") || nombre.endsWith(".docx")) {
    return FileText;
  }
  return Paperclip;
}

export function AttachmentsList({
  archivos,
  entidadTipo,
  entidadId,
  canDelete = false,
  onDeleted,
  emptyMessage = "Sin archivos adjuntos",
}: {
  archivos: ArchivoAdjunto[];
  entidadTipo?: EntidadTipoTrazabilidad;
  entidadId?: string;
  canDelete?: boolean;
  onDeleted?: (id: string) => void;
  emptyMessage?: string;
}) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerArchivo, setViewerArchivo] = useState<ArchivoAdjunto | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [pending, startTransition] = useTransition();

  if (archivos.length === 0) {
    return <p className="text-xs text-slate-500">{emptyMessage}</p>;
  }

  async function abrirVisor(archivo: ArchivoAdjunto) {
    setViewerArchivo(archivo);
    setViewerOpen(true);
    setLoadingUrl(true);
    setViewerUrl(null);
    try {
      const url = await obtenerUrlArchivoAction(archivo);
      setViewerUrl(url);
    } finally {
      setLoadingUrl(false);
    }
  }

  async function descargar(archivo: ArchivoAdjunto) {
    const url = await obtenerUrlArchivoAction(archivo);
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = archivo.nombre;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.click();
  }

  function eliminar(archivo: ArchivoAdjunto) {
    if (!entidadTipo || !entidadId) return;
    startTransition(async () => {
      const ok = await eliminarArchivoAction(archivo, entidadTipo, entidadId);
      if (ok) onDeleted?.(archivo.id);
    });
  }

  return (
    <>
      <ul className="space-y-2">
        {archivos.map((a) => {
          const Icon = iconoArchivo(a);
          return (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-slate-50 p-3 text-sm"
            >
              <div className="flex min-w-0 flex-1 items-start gap-2">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800">{a.nombre}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(a.fechaCarga.slice(0, 10))} · {formatBytes(a.tamano)}
                    {a.cargadoPorNombre ? ` · ${a.cargadoPorNombre}` : ""}
                  </p>
                  {a.descripcion && (
                    <p className="mt-0.5 text-xs text-slate-600">{a.descripcion}</p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => abrirVisor(a)}>
                  <Eye className="mr-1 h-3.5 w-3.5" /> Ver
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => descargar(a)}>
                  <Download className="mr-1 h-3.5 w-3.5" /> Descargar
                </Button>
                {canDelete && entidadTipo && entidadId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    disabled={pending}
                    onClick={() => eliminar(a)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Eliminar
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <Modal
        open={viewerOpen}
        onClose={() => {
          setViewerOpen(false);
          setViewerArchivo(null);
          setViewerUrl(null);
        }}
        title={viewerArchivo?.nombre ?? "Documento"}
        footer={
          <Button
            variant="secondary"
            onClick={() => {
              setViewerOpen(false);
              setViewerArchivo(null);
              setViewerUrl(null);
            }}
          >
            Cerrar
          </Button>
        }
      >
        {loadingUrl ? (
          <p className="py-8 text-center text-sm text-slate-500">Cargando documento…</p>
        ) : viewerArchivo ? (
          <DocumentViewer archivo={viewerArchivo} url={viewerUrl} />
        ) : null}
      </Modal>
    </>
  );
}

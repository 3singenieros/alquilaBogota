"use client";

import { eliminarArchivoAction } from "@/app/actions/file-storage.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isMockMode } from "@/config/app-mode";
import {
  archivosDesdeFiles,
  type CargadoPorAdjunto,
} from "@/lib/archivos-adjuntos";
import {
  esAdjuntoPendienteSubida,
  subirArchivosCliente,
  type UploadContext,
} from "@/lib/adjuntos-client";
import type { ArchivoAdjunto } from "@/types";
import { FileUp, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function formatBytes(size?: number): string {
  if (size === undefined) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function MultiFileUploader({
  value,
  onChange,
  name,
  label = "Documentos y evidencias",
  cargadoPor,
  allowDescriptions = false,
  disabled = false,
  uploadContext,
  onPendingFilesChange,
  autoUpload = true,
}: {
  value: ArchivoAdjunto[];
  onChange: (archivos: ArchivoAdjunto[]) => void;
  name?: string;
  label?: string;
  cargadoPor?: CargadoPorAdjunto;
  allowDescriptions?: boolean;
  disabled?: boolean;
  /** Contexto Storage; si incluye entidadId y autoUpload, sube al seleccionar. */
  uploadContext?: UploadContext;
  /** Archivos locales pendientes de subir (flujo crear entidad). */
  onPendingFilesChange?: (files: File[]) => void;
  autoUpload?: boolean;
}) {
  const [descripciones, setDescripciones] = useState<Record<string, string>>({});
  const [pendingById, setPendingById] = useState<Map<string, File>>(new Map());
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mock = isMockMode();
  const puedeSubirInmediato =
    !mock && autoUpload && Boolean(uploadContext?.entidadId) && !disabled;

  const jsonValue = useMemo(() => JSON.stringify(value), [value]);

  useEffect(() => {
    onPendingFilesChange?.([...pendingById.values()]);
  }, [pendingById, onPendingFilesChange]);

  async function agregar(files: FileList | null) {
    if (!files?.length || disabled || uploading) return;
    setError(null);

    const list = Array.from(files);

    if (mock || !uploadContext) {
      const nuevos = archivosDesdeFiles(list, cargadoPor).map((a) => ({
        ...a,
        descripcion: descripciones[a.id] || a.descripcion,
      }));
      onChange([...value, ...nuevos]);
      return;
    }

    if (puedeSubirInmediato && uploadContext.entidadId) {
      setUploading(true);
      try {
        const subidos = await subirArchivosCliente(list, {
          ...uploadContext,
          entidadId: uploadContext.entidadId,
        });
        onChange([...value, ...subidos]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al subir archivos");
      } finally {
        setUploading(false);
      }
      return;
    }

    const nuevos = archivosDesdeFiles(list, cargadoPor);
    const nextPending = new Map(pendingById);
    for (let i = 0; i < list.length; i++) {
      nextPending.set(nuevos[i].id, list[i]);
    }
    setPendingById(nextPending);
    onChange([...value, ...nuevos]);
  }

  async function quitar(id: string) {
    if (disabled || uploading) return;
    setError(null);

    const archivo = value.find((a) => a.id === id);
    if (
      archivo &&
      !esAdjuntoPendienteSubida(archivo) &&
      uploadContext?.entidadTipo &&
      uploadContext?.entidadId
    ) {
      setUploading(true);
      try {
        await eliminarArchivoAction(
          archivo,
          uploadContext.entidadTipo,
          uploadContext.entidadId
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al eliminar archivo");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    onChange(value.filter((a) => a.id !== id));
    setPendingById((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
    setDescripciones((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function actualizarDescripcion(id: string, descripcion: string) {
    setDescripciones((prev) => ({ ...prev, [id]: descripcion }));
    onChange(
      value.map((a) => (a.id === id ? { ...a, descripcion: descripcion || undefined } : a))
    );
  }

  const hint = mock
    ? "Modo mock: se guarda metadata simulada sin subida real."
    : uploadContext?.entidadId
      ? "Los archivos se suben a Supabase Storage al seleccionarlos."
      : "Los archivos se subirán al guardar el formulario.";

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-3">
      {name ? <input type="hidden" name={name} value={jsonValue} readOnly /> : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <label
          className={
            disabled || uploading
              ? "pointer-events-none opacity-50"
              : "inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          }
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FileUp className="h-3.5 w-3.5" />
          )}
          {uploading ? "Subiendo…" : "Agregar archivos"}
          <input
            type="file"
            multiple
            className="sr-only"
            disabled={disabled || uploading}
            onChange={(e) => {
              void agregar(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {value.length === 0 ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : (
        <ul className="space-y-2">
          {value.map((a) => {
            const pendiente = pendingById.has(a.id) || esAdjuntoPendienteSubida(a);
            return (
              <li
                key={a.id}
                className="flex flex-col gap-2 rounded-md border border-[var(--border)] bg-white p-2 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{a.nombre}</p>
                    <p className="text-xs text-slate-500">
                      {a.tipo || "tipo desconocido"} · {formatBytes(a.tamano)}
                      {pendiente && !mock ? " · pendiente de subir" : ""}
                      {a.bucket ? ` · ${a.bucket}` : ""}
                    </p>
                    {a.cargadoPorNombre && (
                      <p className="text-xs text-slate-400">
                        {a.cargadoPorNombre} ({a.cargadoPorRol})
                      </p>
                    )}
                  </div>
                  {!disabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      title="Quitar"
                      disabled={uploading}
                      onClick={() => void quitar(a.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {allowDescriptions && (
                  <Input
                    placeholder="Descripción opcional"
                    value={a.descripcion ?? descripciones[a.id] ?? ""}
                    disabled={disabled || uploading}
                    onChange={(e) => actualizarDescripcion(a.id, e.target.value)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  archivosDesdeFiles,
  type CargadoPorAdjunto,
} from "@/lib/archivos-adjuntos";
import type { ArchivoAdjunto } from "@/types";
import { FileUp, X } from "lucide-react";
import { useMemo, useState } from "react";

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
}: {
  value: ArchivoAdjunto[];
  onChange: (archivos: ArchivoAdjunto[]) => void;
  /** Si se indica, serializa JSON en input hidden para FormData clásico. */
  name?: string;
  label?: string;
  cargadoPor?: CargadoPorAdjunto;
  allowDescriptions?: boolean;
  disabled?: boolean;
}) {
  const [descripciones, setDescripciones] = useState<Record<string, string>>({});

  const jsonValue = useMemo(() => JSON.stringify(value), [value]);

  function agregar(files: FileList | null) {
    if (!files?.length || disabled) return;
    const nuevos = archivosDesdeFiles(files, cargadoPor).map((a) => ({
      ...a,
      descripcion: descripciones[a.id] || a.descripcion,
    }));
    onChange([...value, ...nuevos]);
  }

  function quitar(id: string) {
    if (disabled) return;
    onChange(value.filter((a) => a.id !== id));
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

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-3">
      {name ? <input type="hidden" name={name} value={jsonValue} readOnly /> : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <label
          className={
            disabled
              ? "pointer-events-none opacity-50"
              : "inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          }
        >
          <FileUp className="h-3.5 w-3.5" />
          Agregar archivos
          <input
            type="file"
            multiple
            className="sr-only"
            disabled={disabled}
            onChange={(e) => {
              agregar(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {value.length === 0 ? (
        <p className="text-xs text-slate-500">
          Sin archivos. Se guardará nombre, tipo y tamaño (simulado, sin subida real).
        </p>
      ) : (
        <ul className="space-y-2">
          {value.map((a) => (
            <li
              key={a.id}
              className="flex flex-col gap-2 rounded-md border border-[var(--border)] bg-white p-2 text-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800">{a.nombre}</p>
                  <p className="text-xs text-slate-500">
                    {a.tipo || "tipo desconocido"} · {formatBytes(a.tamano)}
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
                    onClick={() => quitar(a.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {allowDescriptions && (
                <Input
                  placeholder="Descripción opcional"
                  value={a.descripcion ?? descripciones[a.id] ?? ""}
                  disabled={disabled}
                  onChange={(e) => actualizarDescripcion(a.id, e.target.value)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { totalAdjuntos } from "@/lib/archivos-adjuntos";
import { formatDate } from "@/lib/utils";
import type { ArchivoAdjunto } from "@/types";
import { Paperclip } from "lucide-react";
import { useState } from "react";

function formatBytes(size?: number): string {
  if (size === undefined) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdjuntosCount({
  listas,
}: {
  listas: (ArchivoAdjunto[] | undefined)[];
}) {
  const n = totalAdjuntos(...listas);
  if (n === 0) return <span className="text-xs text-slate-400">0</span>;
  return <span className="text-xs font-medium text-indigo-600">{n}</span>;
}

export function VerAdjuntosButton({
  titulo = "Documentos adjuntos",
  listas,
}: {
  titulo?: string;
  listas: { etiqueta: string; archivos?: ArchivoAdjunto[] }[];
}) {
  const [open, setOpen] = useState(false);
  const total = listas.reduce((s, l) => s + (l.archivos?.length ?? 0), 0);

  if (total === 0) {
    return <span className="text-xs text-slate-400">Sin adjuntos</span>;
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-indigo-600"
        onClick={() => setOpen(true)}
      >
        <Paperclip className="mr-1 h-3.5 w-3.5" />
        Ver adjuntos ({total})
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={titulo}
        footer={
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cerrar
          </Button>
        }
      >
        <div className="space-y-4">
          {listas.map(
            (grupo) =>
              (grupo.archivos?.length ?? 0) > 0 && (
                <div key={grupo.etiqueta}>
                  <h4 className="mb-2 text-sm font-medium text-slate-700">
                    {grupo.etiqueta}
                  </h4>
                  <ul className="space-y-2">
                    {grupo.archivos!.map((a) => (
                      <li
                        key={a.id}
                        className="rounded-lg border border-[var(--border)] bg-slate-50 p-3 text-sm"
                      >
                        <p className="font-medium text-slate-800">{a.nombre}</p>
                        <p className="text-xs text-slate-500">
                          {formatDate(a.fechaCarga.slice(0, 10))} · {formatBytes(a.tamano)}
                          {a.cargadoPorNombre
                            ? ` · ${a.cargadoPorNombre} (${a.cargadoPorRol})`
                            : ""}
                        </p>
                        {a.descripcion && (
                          <p className="mt-1 text-xs text-slate-600">{a.descripcion}</p>
                        )}
                        {a.urlSimulada && (
                          <p className="mt-1 font-mono text-xs text-slate-400">
                            {a.urlSimulada}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )
          )}
        </div>
      </Modal>
    </>
  );
}

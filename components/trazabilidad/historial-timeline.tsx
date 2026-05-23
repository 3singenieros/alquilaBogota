"use client";

import { StatusBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { EventoTrazabilidad } from "@/types/trazabilidad";

export function HistorialTimeline({
  eventos,
  emptyMessage = "Sin eventos registrados.",
}: {
  eventos: EventoTrazabilidad[];
  emptyMessage?: string;
}) {
  if (eventos.length === 0) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <ol className="relative space-y-4 border-l border-indigo-200 pl-6">
      {eventos.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[1.6rem] top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />
          <div className="rounded-lg border border-[var(--border)] bg-white p-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={e.accion} variant="primary" />
              <span className="text-xs text-slate-500">
                {formatDate(e.fechaHora.slice(0, 10))}{" "}
                {e.fechaHora.includes("T")
                  ? e.fechaHora.slice(11, 19)
                  : ""}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-800">{e.descripcion}</p>
            <p className="mt-1 text-xs text-slate-500">
              {e.usuarioNombre} ({e.usuarioRol}) · {e.entidadTipo}{" "}
              <span className="font-mono">{e.entidadId}</span>
            </p>
            {e.estadoAnterior && e.estadoNuevo ? (
              <p className="mt-1 text-xs text-indigo-700">
                Estado: {e.estadoAnterior} → {e.estadoNuevo}
              </p>
            ) : null}
            {(e.valoresAnteriores || e.valoresNuevos) && (
              <details className="mt-2 text-xs text-slate-600">
                <summary className="cursor-pointer font-medium">Valores</summary>
                <pre className="mt-1 max-h-32 overflow-auto rounded bg-slate-50 p-2">
                  {JSON.stringify(
                    { anterior: e.valoresAnteriores, nuevo: e.valoresNuevos },
                    null,
                    2
                  )}
                </pre>
              </details>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

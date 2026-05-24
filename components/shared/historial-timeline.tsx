"use client";

import { StatusBadge, estadoVariant } from "@/components/ui/badge";
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
    return <p className="text-sm text-slate-500 py-4">{emptyMessage}</p>;
  }

  return (
    <ol className="relative border-l border-slate-200 ml-2 space-y-4 py-2">
      {eventos.map((e) => (
        <li key={e.id} className="ml-4">
          <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-indigo-500 ring-4 ring-white" />
          <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs text-slate-500">
                {formatDate(e.fechaHora.slice(0, 10))}{" "}
                {e.fechaHora.slice(11, 16)}
              </span>
              <StatusBadge label={e.accion} variant={estadoVariant(e.accion)} />
            </div>
            <p className="text-slate-800">{e.descripcion}</p>
            <p className="text-xs text-slate-500 mt-1">
              {e.usuarioNombre} · {e.usuarioRol} · {e.entidadTipo} {e.entidadId}
            </p>
            {e.estadoAnterior && e.estadoNuevo && (
              <p className="text-xs text-slate-600 mt-0.5">
                {e.estadoAnterior} → {e.estadoNuevo}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

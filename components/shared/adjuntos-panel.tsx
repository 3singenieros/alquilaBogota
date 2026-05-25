"use client";

import { AttachmentsList } from "@/components/shared/attachments-list";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { totalAdjuntos } from "@/lib/archivos-adjuntos";
import type { ArchivoAdjunto } from "@/types";
import type { EntidadTipoTrazabilidad } from "@/types/trazabilidad";
import { Paperclip } from "lucide-react";
import { useState } from "react";

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
  entidadTipo,
  entidadId,
  canDelete = false,
}: {
  titulo?: string;
  listas: {
    etiqueta: string;
    archivos?: ArchivoAdjunto[];
    entidadTipo?: EntidadTipoTrazabilidad;
    entidadId?: string;
  }[];
  entidadTipo?: EntidadTipoTrazabilidad;
  entidadId?: string;
  canDelete?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [localListas, setLocalListas] = useState(listas);
  const total = localListas.reduce((s, l) => s + (l.archivos?.length ?? 0), 0);

  if (total === 0) {
    return <span className="text-xs text-slate-400">Sin adjuntos</span>;
  }

  function handleDeleted(grupoIdx: number, id: string) {
    setLocalListas((prev) =>
      prev.map((g, i) =>
        i === grupoIdx
          ? { ...g, archivos: g.archivos?.filter((a) => a.id !== id) }
          : g
      )
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-indigo-600"
        onClick={() => {
          setLocalListas(listas);
          setOpen(true);
        }}
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
          {localListas.map(
            (grupo, idx) =>
              (grupo.archivos?.length ?? 0) > 0 && (
                <div key={grupo.etiqueta}>
                  <h4 className="mb-2 text-sm font-medium text-slate-700">
                    {grupo.etiqueta}
                  </h4>
                  <AttachmentsList
                    archivos={grupo.archivos ?? []}
                    entidadTipo={grupo.entidadTipo ?? entidadTipo}
                    entidadId={grupo.entidadId ?? entidadId}
                    canDelete={canDelete}
                    onDeleted={(id) => handleDeleted(idx, id)}
                  />
                </div>
              )
          )}
        </div>
      </Modal>
    </>
  );
}

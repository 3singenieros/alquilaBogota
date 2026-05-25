"use client";

import {
  listarAdjuntosMantenimientoAction,
  listarArchivosEntidadAction,
} from "@/app/actions/file-storage.actions";
import { AttachmentsList } from "@/components/shared/attachments-list";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { totalAdjuntos } from "@/lib/archivos-adjuntos";
import type { ArchivoAdjunto } from "@/types";
import type { EntidadTipoTrazabilidad } from "@/types/trazabilidad";
import { Loader2, Paperclip } from "lucide-react";
import { useEffect, useState } from "react";

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
    /** Solo mantenimiento: EVIDENCIA | CIERRE */
    tipoDocumento?: string;
  }[];
  entidadTipo?: EntidadTipoTrazabilidad;
  entidadId?: string;
  canDelete?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [localListas, setLocalListas] = useState(listas);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const propTotal = listas.reduce((s, l) => s + (l.archivos?.length ?? 0), 0);
  const total = localListas.reduce((s, l) => s + (l.archivos?.length ?? 0), 0);

  const puedeConsultar =
    propTotal > 0 ||
    Boolean(entidadTipo && entidadId) ||
    listas.some((g) => g.entidadTipo && g.entidadId);

  useEffect(() => {
    setLocalListas(listas);
  }, [listas]);

  if (!puedeConsultar) {
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

  async function handleOpen() {
    setOpen(true);
    setLoading(true);
    setFetched(false);
    try {
      const mntId =
        entidadId ?? listas.find((g) => g.entidadTipo === "MANTENIMIENTO")?.entidadId;
      const usaSplitMantenimiento =
        Boolean(mntId) &&
        listas.some((g) => g.tipoDocumento && (g.entidadTipo ?? entidadTipo) === "MANTENIMIENTO");

      let updated = listas;
      if (usaSplitMantenimiento && mntId) {
        const split = await listarAdjuntosMantenimientoAction(mntId);
        updated = listas.map((grupo) => {
          const tipo = grupo.entidadTipo ?? entidadTipo;
          const id = grupo.entidadId ?? entidadId ?? mntId;
          const archivos =
            grupo.tipoDocumento === "CIERRE"
              ? split.documentosCierreAdjuntos
              : grupo.tipoDocumento === "EVIDENCIA"
                ? split.evidenciasAdjuntas
                : [
                    ...split.evidenciasAdjuntas,
                    ...split.documentosCierreAdjuntos,
                  ];
          return { ...grupo, archivos, entidadTipo: tipo, entidadId: id };
        });
      } else {
        updated = await Promise.all(
          listas.map(async (grupo) => {
            const tipo = grupo.entidadTipo ?? entidadTipo;
            const id = grupo.entidadId ?? entidadId;
            if (tipo && id) {
              const archivos = await listarArchivosEntidadAction(tipo, id);
              return { ...grupo, archivos, entidadTipo: tipo, entidadId: id };
            }
            return grupo;
          })
        );
      }
      setLocalListas(updated);
      setFetched(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-indigo-600"
        disabled={loading}
        data-testid="ver-adjuntos-button"
        onClick={() => void handleOpen()}
      >
        {loading ? (
          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Paperclip className="mr-1 h-3.5 w-3.5" />
        )}
        {propTotal > 0 ? `Ver adjuntos (${propTotal})` : "Ver comprobantes"}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={titulo}
        footer={
          <Button
            variant="secondary"
            data-testid="document-viewer-close"
            onClick={() => setOpen(false)}
          >
            Cerrar
          </Button>
        }
      >
        <div className="space-y-4">
          {loading ? (
            <p className="text-sm text-slate-500">Cargando documentos...</p>
          ) : fetched && total === 0 ? (
            <p className="text-sm text-slate-500">No hay documentos adjuntos.</p>
          ) : (
            localListas.map(
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
            )
          )}
        </div>
      </Modal>
    </>
  );
}

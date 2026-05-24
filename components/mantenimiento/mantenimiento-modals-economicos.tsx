"use client";

import {
  cerrarMantenimientoTicketAction,
  definirResponsabilidadMantenimientoAction,
  responderResponsabilidadCompartidaAction,
} from "@/app/(dashboard)/mantenimiento/actions";
import { MultiFileUploader } from "@/components/shared/multi-file-uploader";
import { Button } from "@/components/ui/button";
import { FormField, Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CargadoPorAdjunto } from "@/lib/archivos-adjuntos";
import type { ArchivoAdjunto, Mantenimiento, TipoResponsabilidadMantenimiento } from "@/types";
import { useState, useTransition } from "react";

const TIPOS_RESP: TipoResponsabilidadMantenimiento[] = [
  "POR_DEFINIR",
  "ARRENDADOR",
  "ARRENDATARIO",
  "COMPARTIDO",
];

export function MantenimientoModalsEconomicos({
  selected,
  responsabilidadOpen,
  cerrarOpen,
  aceptarOpen,
  onCloseResponsabilidad,
  onCloseCerrar,
  onCloseAceptar,
  onUpdated,
  cargadoPor,
}: {
  selected: Mantenimiento | null;
  responsabilidadOpen: boolean;
  cerrarOpen: boolean;
  aceptarOpen: boolean;
  onCloseResponsabilidad: () => void;
  onCloseCerrar: () => void;
  onCloseAceptar: () => void;
  onUpdated: (m: Mantenimiento) => void;
  cargadoPor: CargadoPorAdjunto;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [docsCierre, setDocsCierre] = useState<ArchivoAdjunto[]>([]);
  const [pending, startTransition] = useTransition();

  function handleResponsabilidad(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    const tipo = fd.get("tipoResponsabilidad") as TipoResponsabilidadMantenimiento;
    startTransition(async () => {
      try {
        const updated = await definirResponsabilidadMantenimientoAction(selected.id, {
          tipoResponsabilidad: tipo,
          tipoMantenimiento: fd.get("tipoMantenimiento") as Mantenimiento["tipoMantenimiento"],
          valorEstimado: fd.get("valorEstimado")
            ? Number(fd.get("valorEstimado"))
            : undefined,
          fechaEstimadaAtencion: (fd.get("fechaEstimadaAtencion") as string) || undefined,
          observacionesResponsabilidad:
            (fd.get("observacionesResponsabilidad") as string) || undefined,
          porcentajeArrendador: fd.get("porcentajeArrendador")
            ? Number(fd.get("porcentajeArrendador"))
            : undefined,
          porcentajeArrendatario: fd.get("porcentajeArrendatario")
            ? Number(fd.get("porcentajeArrendatario"))
            : undefined,
        });
        if (updated) {
          onUpdated(updated);
          onCloseResponsabilidad();
        }
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  function handleCerrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const updated = await cerrarMantenimientoTicketAction(selected.id, {
          fechaCierre: fd.get("fechaCierre") as string,
          valorFinal: fd.get("valorFinal") ? Number(fd.get("valorFinal")) : undefined,
          observacionesCierre: (fd.get("observacionesCierre") as string) || undefined,
          documentosCierreAdjuntos: docsCierre,
        });
        if (updated) {
          onUpdated(updated);
          setDocsCierre([]);
          onCloseCerrar();
        }
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Error al cerrar");
      }
    });
  }

  function handleAceptar(aceptar: boolean, motivo?: string) {
    if (!selected) return;
    setFormError(null);
    startTransition(async () => {
      try {
        const updated = await responderResponsabilidadCompartidaAction(selected.id, {
          aceptar,
          motivoRechazoResponsabilidad: motivo,
        });
        if (updated) {
          onUpdated(updated);
          onCloseAceptar();
        }
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Error al responder");
      }
    });
  }

  const requiereValor =
    selected?.tipoResponsabilidad === "ARRENDADOR" ||
    selected?.tipoResponsabilidad === "COMPARTIDO";

  return (
    <>
      <Modal
        open={responsabilidadOpen}
        onClose={onCloseResponsabilidad}
        title={`Responsabilidad económica — ${selected?.code ?? ""}`}
        footer={
          <>
            <Button variant="secondary" onClick={onCloseResponsabilidad}>
              Cancelar
            </Button>
            <Button type="submit" form="mnt-resp-form" disabled={pending}>
              Guardar
            </Button>
          </>
        }
      >
        {formError && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}
        {selected && (
          <form id="mnt-resp-form" onSubmit={handleResponsabilidad} className="space-y-4">
            <FormField label="Tipo de responsabilidad">
              <Select
                name="tipoResponsabilidad"
                defaultValue={selected.tipoResponsabilidad ?? "POR_DEFINIR"}
              >
                {TIPOS_RESP.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Tipo de mantenimiento">
              <Select
                name="tipoMantenimiento"
                defaultValue={selected.tipoMantenimiento ?? "CORRECTIVO"}
              >
                <option value="LOCATIVO">LOCATIVO</option>
                <option value="ESTRUCTURAL">ESTRUCTURAL</option>
                <option value="PREVENTIVO">PREVENTIVO</option>
                <option value="CORRECTIVO">CORRECTIVO</option>
                <option value="INSPECCION">INSPECCION</option>
                <option value="ADMINISTRATIVO">ADMINISTRATIVO</option>
              </Select>
            </FormField>
            <FormField label="Valor estimado (arrendador / compartido)">
              <Input
                name="valorEstimado"
                type="number"
                defaultValue={selected.valorEstimado}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="% Arrendador">
                <Input
                  name="porcentajeArrendador"
                  type="number"
                  defaultValue={selected.porcentajeArrendador}
                />
              </FormField>
              <FormField label="% Arrendatario">
                <Input
                  name="porcentajeArrendatario"
                  type="number"
                  defaultValue={selected.porcentajeArrendatario}
                />
              </FormField>
            </div>
            <FormField label="Fecha estimada de atención">
              <Input
                name="fechaEstimadaAtencion"
                type="date"
                defaultValue={selected.fechaEstimadaAtencion}
              />
            </FormField>
            <FormField label="Observaciones">
              <Input
                name="observacionesResponsabilidad"
                defaultValue={selected.observacionesResponsabilidad}
              />
            </FormField>
          </form>
        )}
      </Modal>

      <Modal
        open={cerrarOpen}
        onClose={onCloseCerrar}
        title={`Cerrar ticket — ${selected?.code ?? ""}`}
        footer={
          <>
            <Button variant="secondary" onClick={onCloseCerrar}>
              Cancelar
            </Button>
            <Button type="submit" form="mnt-cerrar-form" disabled={pending}>
              Cerrar ticket
            </Button>
          </>
        }
      >
        {formError && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}
        {selected && (
          <form id="mnt-cerrar-form" onSubmit={handleCerrar} className="space-y-4">
            <p className="text-sm text-slate-600">
              Responsabilidad: <strong>{selected.tipoResponsabilidad ?? "POR_DEFINIR"}</strong>
            </p>
            {requiereValor && (
              <FormField label="Valor final">
                <Input
                  name="valorFinal"
                  type="number"
                  defaultValue={selected.valorFinal ?? selected.valorEstimado}
                  required
                />
              </FormField>
            )}
            <FormField label="Fecha de cierre">
              <Input
                name="fechaCierre"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                required
              />
            </FormField>
            <FormField label="Observaciones de cierre">
              <Input name="observacionesCierre" required />
            </FormField>
            {(selected.tipoResponsabilidad === "ARRENDADOR" ||
              selected.tipoResponsabilidad === "COMPARTIDO") && (
              <MultiFileUploader
                label="Documentos de cierre (obligatorio)"
                value={docsCierre}
                onChange={setDocsCierre}
                cargadoPor={cargadoPor}
              />
            )}
          </form>
        )}
      </Modal>

      <Modal
        open={aceptarOpen}
        onClose={onCloseAceptar}
        title={`Distribución compartida — ${selected?.code ?? ""}`}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onCloseAceptar}>
              Cancelar
            </Button>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => {
                const motivo = prompt("Motivo de rechazo:");
                if (motivo?.trim()) handleAceptar(false, motivo.trim());
              }}
            >
              Rechazar
            </Button>
            <Button disabled={pending} onClick={() => handleAceptar(true)}>
              Aceptar distribución
            </Button>
          </div>
        }
      >
        {formError && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}
        {selected && (
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-slate-500">Valor estimado</dt>
              <dd>${selected.valorEstimado?.toLocaleString("es-CO")}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Distribución</dt>
              <dd>
                Arrendador {selected.porcentajeArrendador}% ($
                {selected.valorArrendador?.toLocaleString("es-CO")}) · Arrendatario{" "}
                {selected.porcentajeArrendatario}% ($
                {selected.valorArrendatario?.toLocaleString("es-CO")})
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Observaciones</dt>
              <dd>{selected.observacionesResponsabilidad}</dd>
            </div>
          </dl>
        )}
      </Modal>
    </>
  );
}

"use client";

import {
  crearServicioContratoAction,
  inactivarServicioContratoAction,
  listarServiciosContratoContratoAction,
} from "@/app/(dashboard)/contratos/actions-servicios";
import { FormField, Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import {
  PERIODICIDAD_LABEL,
  TIPO_SERVICIO_LABEL,
  TIPOS_SERVICIO,
} from "@/lib/servicios-labels";
import type { Contrato, PeriodicidadServicio, ServicioPublicoContrato, TipoServicioPublico } from "@/types";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

export function ContratoServiciosModal({
  contrato,
  open,
  onClose,
  canEdit,
}: {
  contrato: Contrato | null;
  open: boolean;
  onClose: () => void;
  canEdit: boolean;
}) {
  const [items, setItems] = useState<ServicioPublicoContrato[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || !contrato) return;
    startTransition(async () => {
      const list = await listarServiciosContratoContratoAction(contrato.id);
      setItems(list);
    });
  }, [open, contrato?.id]);

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!contrato) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      tipoServicio: fd.get("tipoServicio") as TipoServicioPublico,
      empresaPrestadora: fd.get("empresaPrestadora") as string,
      numeroCuentaServicio: fd.get("numeroCuentaServicio") as string,
      periodicidad: fd.get("periodicidad") as PeriodicidadServicio,
      observaciones: (fd.get("observaciones") as string) || undefined,
    };
    startTransition(async () => {
      const created = await crearServicioContratoAction(contrato.id, payload);
      if (created) {
        setItems((prev) => [...prev, created]);
        form.reset();
      }
    });
  }

  function inactivar(id: string) {
    if (!confirm("¿Inactivar este servicio del contrato?")) return;
    startTransition(async () => {
      const updated = await inactivarServicioContratoAction(id);
      if (updated) {
        setItems((prev) =>
          prev.map((s) => (s.id === id ? { ...s, activo: false } : s))
        );
      }
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={contrato ? `Servicios públicos — ${contrato.code}` : "Servicios del contrato"}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <p className="mb-4 text-sm text-slate-600">
        Configure aquí los servicios asociados al contrato. El arrendatario reportará los pagos
        periódicos en el módulo <strong>Servicios públicos</strong> (no es el pago del canon).
      </p>

      <Table>
        <thead>
          <tr>
            <Th>Tipo</Th>
            <Th>Empresa</Th>
            <Th>Cuenta</Th>
            <Th>Periodicidad</Th>
            <Th>Estado</Th>
            {canEdit && <Th />}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <Td colSpan={canEdit ? 6 : 5} className="text-center text-sm text-slate-500">
                Sin servicios configurados.
              </Td>
            </tr>
          ) : (
            items.map((s) => (
              <Tr key={s.id}>
                <Td>{TIPO_SERVICIO_LABEL[s.tipoServicio]}</Td>
                <Td className="text-xs">{s.empresaPrestadora}</Td>
                <Td className="font-mono text-xs">{s.numeroCuentaServicio}</Td>
                <Td>{PERIODICIDAD_LABEL[s.periodicidad]}</Td>
                <Td>{s.activo ? "Activo" : "Inactivo"}</Td>
                {canEdit && s.activo && (
                  <Td>
                    <Button variant="ghost" size="sm" onClick={() => inactivar(s.id)} disabled={pending}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </Td>
                )}
              </Tr>
            ))
          )}
        </tbody>
      </Table>

      {canEdit && contrato && (
        <form onSubmit={handleAdd} className="mt-6 space-y-3 rounded-lg border border-[var(--border)] p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Agregar servicio</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Tipo">
              <Select name="tipoServicio" defaultValue="AGUA" required>
                {TIPOS_SERVICIO.map((t) => (
                  <option key={t} value={t}>
                    {TIPO_SERVICIO_LABEL[t]}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Periodicidad">
              <Select name="periodicidad" defaultValue="MENSUAL" required>
                <option value="MENSUAL">Mensual</option>
                <option value="BIMESTRAL">Bimestral</option>
              </Select>
            </FormField>
            <FormField label="Empresa prestadora">
              <Input name="empresaPrestadora" placeholder="Enel, Acueducto..." required />
            </FormField>
            <FormField label="Número de cuenta">
              <Input name="numeroCuentaServicio" required />
            </FormField>
            <FormField label="Observaciones" className="sm:col-span-2">
              <Input name="observaciones" />
            </FormField>
          </div>
          <Button type="submit" disabled={pending}>
            <Plus className="h-4 w-4" /> Agregar al contrato
          </Button>
        </form>
      )}
    </Modal>
  );
}

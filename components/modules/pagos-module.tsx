"use client";

import {
  actualizarPagoAction,
  crearPagoAction,
  eliminarPagoAction,
} from "@/app/(dashboard)/pagos/actions";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusBadge, estadoVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField, Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { EstadoPago, PagoReportado } from "@/types";
import { Plus } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

const ESTADOS: EstadoPago[] = ["REPORTADO", "VALIDADO", "RECHAZADO"];

export function PagosModule({ initialData }: { initialData: PagoReportado[] }) {
  const [items, setItems] = useState(initialData);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(
    () =>
      items.filter((p) => {
        const matchSearch = !search || p.contratoId.includes(search) || p.mes.includes(search);
        const matchEstado = !estadoFilter || p.estado === estadoFilter;
        return matchSearch && matchEstado;
      }),
    [items, search, estadoFilter]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      contratoId: fd.get("contratoId") as string,
      mes: fd.get("mes") as string,
      monto: Number(fd.get("monto")),
      fechaReporte: new Date().toISOString().slice(0, 10),
      estado: "REPORTADO" as EstadoPago,
      comprobanteUrl: (fd.get("comprobanteUrl") as string) || undefined,
      reportadoPorId: "u-arrendatario",
      notas: (fd.get("notas") as string) || undefined,
    };
    startTransition(async () => {
      await crearPagoAction(payload);
      setItems((prev) => [...prev, { ...payload, id: `pag-${Date.now()}` }]);
      setOpen(false);
    });
  }

  return (
    <>
      <PageHeader
        title="Pagos reportados"
        description="Registro de pagos con comprobante — no procesamiento de pagos reales"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Reportar pago
          </Button>
        }
      />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        estado={estadoFilter}
        onEstadoChange={setEstadoFilter}
        estados={ESTADOS.map((e) => ({ value: e, label: e }))}
        placeholder="Contrato o mes..."
      />
      <Table>
        <thead>
          <tr>
            <Th>Contrato</Th>
            <Th>Mes</Th>
            <Th>Monto</Th>
            <Th>Reporte</Th>
            <Th>Estado</Th>
            <Th>Comprobante</Th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <Tr key={p.id}>
              <Td>{p.contratoId}</Td>
              <Td>{p.mes}</Td>
              <Td>{formatCurrency(p.monto)}</Td>
              <Td>{formatDate(p.fechaReporte)}</Td>
              <Td>
                <StatusBadge label={p.estado} variant={estadoVariant(p.estado)} />
              </Td>
              <Td className="text-xs text-indigo-600">{p.comprobanteUrl ?? "—"}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Reportar pago"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" form="pago-form" disabled={pending}>Guardar</Button>
          </>
        }
      >
        <form id="pago-form" onSubmit={handleSubmit} className="space-y-4">
          <FormField label="ID Contrato">
            <Input name="contratoId" defaultValue="ctr-1" required />
          </FormField>
          <FormField label="Mes (YYYY-MM)">
            <Input name="mes" defaultValue="2025-06" required />
          </FormField>
          <FormField label="Monto">
            <Input name="monto" type="number" required />
          </FormField>
          <FormField label="URL comprobante (demo / Storage)">
            <Input name="comprobanteUrl" placeholder="comprobantes/..." />
          </FormField>
          <FormField label="Notas">
            <Input name="notas" />
          </FormField>
        </form>
      </Modal>
    </>
  );
}

"use client";

import { listarContratosFormAction } from "@/app/(dashboard)/contratos/actions";
import { listarInmueblesFormAction } from "@/app/(dashboard)/inmuebles/actions";
import { crearPagoAction } from "@/app/(dashboard)/pagos/actions";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusBadge, estadoVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField, Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { contratoOptionLabel, inmueblesById } from "@/lib/entity-labels";
import { getModulePermissions } from "@/lib/auth/permissions";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Contrato, EstadoPago, Inmueble, PagoReportado, Rol } from "@/types";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";

const ESTADOS: EstadoPago[] = ["REPORTADO", "VALIDADO", "RECHAZADO"];

export function PagosModule({
  initialData,
  contratos,
  inmuebles,
  rol,
  usuarioId,
}: {
  initialData: PagoReportado[];
  contratos: Contrato[];
  inmuebles: Inmueble[];
  rol: Rol;
  usuarioId: string;
}) {
  const perms = getModulePermissions(rol, "pagos");
  const [contratosOptions, setContratosOptions] = useState(contratos);
  const [inmueblesOptions, setInmueblesOptions] = useState(inmuebles);
  const inmueblesMap = useMemo(() => inmueblesById(inmueblesOptions), [inmueblesOptions]);
  const [items, setItems] = useState(initialData);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setContratosOptions(contratos);
    setInmueblesOptions(inmuebles);
  }, [contratos, inmuebles]);

  async function openForm() {
    const [freshContratos, freshInmuebles] = await Promise.all([
      listarContratosFormAction(),
      listarInmueblesFormAction(),
    ]);
    setContratosOptions(freshContratos);
    setInmueblesOptions(freshInmuebles);
    setOpen(true);
  }

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
      reportadoPorId: usuarioId,
      notas: (fd.get("notas") as string) || undefined,
    };
    startTransition(async () => {
      const created = await crearPagoAction(payload);
      if (created) setItems((prev) => [...prev, created]);
      setOpen(false);
    });
  }

  return (
    <>
      <PageHeader
        title="Pagos reportados"
        description="Registro de pagos con comprobante — no procesamiento de pagos reales"
        action={
          perms.canCreate ? (
            <Button onClick={() => openForm()}>
              <Plus className="h-4 w-4" /> Reportar pago
            </Button>
          ) : undefined
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
            <Th>Código</Th>
            <Th>Contrato</Th>
            <Th>Mes</Th>
            <Th>Monto</Th>
            <Th>Reporte</Th>
            <Th>Estado</Th>
            <Th>Comprobante</Th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => {
            const contrato = contratosOptions.find((c) => c.id === p.contratoId);
            return (
            <Tr key={p.id}>
              <Td className="font-mono text-xs text-slate-600">{p.code}</Td>
              <Td>
                {contrato
                  ? contratoOptionLabel(contrato, inmueblesMap)
                  : p.contratoId}
              </Td>
              <Td>{p.mes}</Td>
              <Td>{formatCurrency(p.monto)}</Td>
              <Td>{formatDate(p.fechaReporte)}</Td>
              <Td>
                <StatusBadge label={p.estado} variant={estadoVariant(p.estado)} />
              </Td>
              <Td className="text-xs text-indigo-600">{p.comprobanteUrl ?? "—"}</Td>
            </Tr>
          );
          })}
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
          <FormField label="Contrato">
            <Select name="contratoId" defaultValue={contratosOptions[0]?.id} required>
              {contratosOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {contratoOptionLabel(c, inmueblesMap)}
                </option>
              ))}
            </Select>
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

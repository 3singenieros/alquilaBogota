"use client";

import { crearServicioAction } from "@/app/(dashboard)/servicios/actions";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusBadge, estadoVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField, Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getModulePermissions } from "@/lib/auth/permissions";
import type { EstadoServicio, Rol, ServicioPublico } from "@/types";
import { Plus } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

const ESTADOS: EstadoServicio[] = ["PENDIENTE", "PAGADO", "VENCIDO"];

export function ServiciosModule({
  initialData,
  rol,
}: {
  initialData: ServicioPublico[];
  rol: Rol;
}) {
  const perms = getModulePermissions(rol, "servicios");
  const [items, setItems] = useState(initialData);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(
    () =>
      items.filter((s) => {
        const matchSearch = !search || s.tipo.toLowerCase().includes(search.toLowerCase());
        const matchEstado = !estadoFilter || s.estado === estadoFilter;
        return matchSearch && matchEstado;
      }),
    [items, search, estadoFilter]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      inmuebleId: fd.get("inmuebleId") as string,
      tipo: fd.get("tipo") as string,
      periodo: fd.get("periodo") as string,
      monto: Number(fd.get("monto")),
      vencimiento: fd.get("vencimiento") as string,
      estado: (fd.get("estado") as EstadoServicio) || "PENDIENTE",
    };
    startTransition(async () => {
      await crearServicioAction(payload);
      setItems((prev) => [...prev, { ...payload, id: `srv-${Date.now()}` }]);
      setOpen(false);
    });
  }

  return (
    <>
      <PageHeader
        title="Servicios públicos"
        description="Control de facturas de servicios por inmueble"
        action={
          perms.canCreate ? (
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Registrar
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
        placeholder="Tipo de servicio..."
      />
      <Table>
        <thead>
          <tr>
            <Th>Inmueble</Th>
            <Th>Tipo</Th>
            <Th>Periodo</Th>
            <Th>Monto</Th>
            <Th>Vencimiento</Th>
            <Th>Estado</Th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((s) => (
            <Tr key={s.id}>
              <Td>{s.inmuebleId}</Td>
              <Td>{s.tipo}</Td>
              <Td>{s.periodo}</Td>
              <Td>{formatCurrency(s.monto)}</Td>
              <Td>{formatDate(s.vencimiento)}</Td>
              <Td>
                <StatusBadge label={s.estado} variant={estadoVariant(s.estado)} />
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Registrar servicio"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" form="srv-form" disabled={pending}>Guardar</Button>
          </>
        }
      >
        <form id="srv-form" onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Inmueble ID"><Input name="inmuebleId" defaultValue="inm-1" required /></FormField>
          <FormField label="Tipo"><Input name="tipo" defaultValue="Agua" required /></FormField>
          <FormField label="Periodo"><Input name="periodo" defaultValue="2025-06" required /></FormField>
          <FormField label="Monto"><Input name="monto" type="number" required /></FormField>
          <FormField label="Vencimiento"><Input name="vencimiento" type="date" required /></FormField>
          <FormField label="Estado">
            <Select name="estado" defaultValue="PENDIENTE">
              {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
            </Select>
          </FormField>
        </form>
      </Modal>
    </>
  );
}

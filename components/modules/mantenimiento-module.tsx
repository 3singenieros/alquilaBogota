"use client";

import { crearMantenimientoAction } from "@/app/(dashboard)/mantenimiento/actions";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusBadge, estadoVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField, Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { EstadoMantenimiento, Mantenimiento } from "@/types";
import { Plus } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

const ESTADOS: EstadoMantenimiento[] = ["ABIERTO", "EN_PROGRESO", "RESUELTO", "CERRADO"];

export function MantenimientoModule({ initialData }: { initialData: Mantenimiento[] }) {
  const [items, setItems] = useState(initialData);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(
    () =>
      items.filter((m) => {
        const matchSearch = !search || m.titulo.toLowerCase().includes(search.toLowerCase());
        const matchEstado = !estadoFilter || m.estado === estadoFilter;
        return matchSearch && matchEstado;
      }),
    [items, search, estadoFilter]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      inmuebleId: fd.get("inmuebleId") as string,
      titulo: fd.get("titulo") as string,
      descripcion: fd.get("descripcion") as string,
      prioridad: fd.get("prioridad") as Mantenimiento["prioridad"],
      estado: "ABIERTO" as EstadoMantenimiento,
      solicitadoPorId: "u-arrendatario",
    };
    startTransition(async () => {
      await crearMantenimientoAction(payload);
      setItems((prev) => [
        ...prev,
        { ...payload, id: `mnt-${Date.now()}`, creadoEn: new Date().toISOString().slice(0, 10) },
      ]);
      setOpen(false);
    });
  }

  return (
    <>
      <PageHeader
        title="Mantenimiento"
        description="Solicitudes e incidencias de mantenimiento"
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nueva solicitud</Button>}
      />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        estado={estadoFilter}
        onEstadoChange={setEstadoFilter}
        estados={ESTADOS.map((e) => ({ value: e, label: e }))}
      />
      <Table>
        <thead>
          <tr>
            <Th>Título</Th>
            <Th>Inmueble</Th>
            <Th>Prioridad</Th>
            <Th>Estado</Th>
            <Th>Fecha</Th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((m) => (
            <Tr key={m.id}>
              <Td className="font-medium">{m.titulo}</Td>
              <Td>{m.inmuebleId}</Td>
              <Td>
                <StatusBadge
                  label={m.prioridad}
                  variant={m.prioridad === "ALTA" ? "danger" : m.prioridad === "MEDIA" ? "warning" : "neutral"}
                />
              </Td>
              <Td>
                <StatusBadge label={m.estado} variant={estadoVariant(m.estado)} />
              </Td>
              <Td>{formatDate(m.creadoEn)}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nueva solicitud"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" form="mnt-form" disabled={pending}>Guardar</Button>
          </>
        }
      >
        <form id="mnt-form" onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Inmueble ID"><Input name="inmuebleId" defaultValue="inm-1" required /></FormField>
          <FormField label="Título"><Input name="titulo" required /></FormField>
          <FormField label="Descripción"><Input name="descripcion" required /></FormField>
          <FormField label="Prioridad">
            <Select name="prioridad" defaultValue="MEDIA">
              <option value="BAJA">BAJA</option>
              <option value="MEDIA">MEDIA</option>
              <option value="ALTA">ALTA</option>
            </Select>
          </FormField>
        </form>
      </Modal>
    </>
  );
}

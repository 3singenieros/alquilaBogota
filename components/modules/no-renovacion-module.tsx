"use client";

import { crearNoRenovacionAction } from "@/app/(dashboard)/no-renovacion/actions";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusBadge, estadoVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField, Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { getModulePermissions } from "@/lib/auth/permissions";
import { formatDate } from "@/lib/utils";
import type { Contrato, NoRenovacion, Rol } from "@/types";
import { Plus } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

export function NoRenovacionModule({
  initialData,
  contratos,
  rol,
  usuarioId,
}: {
  initialData: NoRenovacion[];
  contratos: Contrato[];
  rol: Rol;
  usuarioId: string;
}) {
  const perms = getModulePermissions(rol, "no-renovacion");
  const [items, setItems] = useState(initialData);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(
    () =>
      items.filter((n) => {
        const matchSearch = !search || n.motivo.toLowerCase().includes(search.toLowerCase());
        const matchEstado = !estadoFilter || n.estado === estadoFilter;
        return matchSearch && matchEstado;
      }),
    [items, search, estadoFilter]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      contratoId: fd.get("contratoId") as string,
      motivo: fd.get("motivo") as string,
      fechaSolicitud: new Date().toISOString().slice(0, 10),
      estado: "SOLICITADA" as const,
      solicitadoPorId: usuarioId,
    };
    startTransition(async () => {
      await crearNoRenovacionAction(payload);
      setItems((prev) => [...prev, { ...payload, id: `nr-${Date.now()}` }]);
      setOpen(false);
    });
  }

  return (
    <>
      <PageHeader
        title="No renovación"
        description="Solicitudes de terminación sin renovación del contrato"
        action={
          perms.canCreate ? (
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Nueva solicitud
            </Button>
          ) : undefined
        }
      />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        estado={estadoFilter}
        onEstadoChange={setEstadoFilter}
        estados={[
          { value: "SOLICITADA", label: "SOLICITADA" },
          { value: "EN_REVISION", label: "EN_REVISION" },
          { value: "ACEPTADA", label: "ACEPTADA" },
          { value: "RECHAZADA", label: "RECHAZADA" },
        ]}
      />
      <Table>
        <thead>
          <tr>
            <Th>Contrato</Th>
            <Th>Motivo</Th>
            <Th>Fecha</Th>
            <Th>Estado</Th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((n) => (
            <Tr key={n.id}>
              <Td>{n.contratoId}</Td>
              <Td>{n.motivo}</Td>
              <Td>{formatDate(n.fechaSolicitud)}</Td>
              <Td>
                <StatusBadge label={n.estado} variant={estadoVariant(n.estado)} />
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Solicitud de no renovación"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="nr-form" disabled={pending}>
              Enviar
            </Button>
          </>
        }
      >
        <form id="nr-form" onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Contrato">
            <Select name="contratoId" defaultValue={contratos[0]?.id} required>
              {contratos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} — {c.inmuebleId}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Motivo">
            <Input name="motivo" required />
          </FormField>
        </form>
      </Modal>
    </>
  );
}

"use client";

import { listarContratosFormAction } from "@/app/(dashboard)/contratos/actions";
import { listarInmueblesFormAction } from "@/app/(dashboard)/inmuebles/actions";
import { crearNoRenovacionAction } from "@/app/(dashboard)/no-renovacion/actions";
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
import { formatDate } from "@/lib/utils";
import type { Contrato, Inmueble, NoRenovacion, Rol } from "@/types";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";

export function NoRenovacionModule({
  initialData,
  contratos,
  inmuebles,
  rol,
  usuarioId,
}: {
  initialData: NoRenovacion[];
  contratos: Contrato[];
  inmuebles: Inmueble[];
  rol: Rol;
  usuarioId: string;
}) {
  const perms = getModulePermissions(rol, "no-renovacion");
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
      const created = await crearNoRenovacionAction(payload);
      if (created) setItems((prev) => [...prev, created]);
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
            <Button onClick={() => openForm()}>
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
            <Th>Código</Th>
            <Th>Contrato</Th>
            <Th>Motivo</Th>
            <Th>Fecha</Th>
            <Th>Estado</Th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((n) => {
            const contrato = contratosOptions.find((c) => c.id === n.contratoId);
            return (
            <Tr key={n.id}>
              <Td className="font-mono text-xs text-slate-600">{n.code}</Td>
              <Td>
                {contrato
                  ? contratoOptionLabel(contrato, inmueblesMap)
                  : n.contratoId}
              </Td>
              <Td>{n.motivo}</Td>
              <Td>{formatDate(n.fechaSolicitud)}</Td>
              <Td>
                <StatusBadge label={n.estado} variant={estadoVariant(n.estado)} />
              </Td>
            </Tr>
          );
          })}
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
            <Select name="contratoId" defaultValue={contratosOptions[0]?.id} required>
              {contratosOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {contratoOptionLabel(c, inmueblesMap)}
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

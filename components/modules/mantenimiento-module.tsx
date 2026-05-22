"use client";

import { listarInmueblesFormAction } from "@/app/(dashboard)/inmuebles/actions";
import { crearMantenimientoAction } from "@/app/(dashboard)/mantenimiento/actions";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusBadge, estadoVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField, Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { inmuebleDisplayFromId, inmuebleOptionLabel, inmueblesById } from "@/lib/entity-labels";
import { getModulePermissions } from "@/lib/auth/permissions";
import { formatDate } from "@/lib/utils";
import type { EstadoMantenimiento, Inmueble, Mantenimiento, Rol } from "@/types";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";

const ESTADOS: EstadoMantenimiento[] = ["ABIERTO", "EN_PROGRESO", "RESUELTO", "CERRADO"];

export function MantenimientoModule({
  initialData,
  inmuebles,
  rol,
  usuarioId,
}: {
  initialData: Mantenimiento[];
  inmuebles: Inmueble[];
  rol: Rol;
  usuarioId: string;
}) {
  const perms = getModulePermissions(rol, "mantenimiento");
  const [inmueblesOptions, setInmueblesOptions] = useState(inmuebles);
  const inmueblesMap = useMemo(() => inmueblesById(inmueblesOptions), [inmueblesOptions]);
  const [items, setItems] = useState(initialData);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setInmueblesOptions(inmuebles);
  }, [inmuebles]);

  async function openForm() {
    const fresh = await listarInmueblesFormAction();
    setInmueblesOptions(fresh);
    setOpen(true);
  }

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
      solicitadoPorId: usuarioId,
    };
    startTransition(async () => {
      const created = await crearMantenimientoAction(payload);
      if (created) setItems((prev) => [...prev, created]);
      setOpen(false);
    });
  }

  return (
    <>
      <PageHeader
        title="Mantenimiento"
        description="Solicitudes e incidencias de mantenimiento"
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
        estados={ESTADOS.map((e) => ({ value: e, label: e }))}
      />
      <Table>
        <thead>
          <tr>
            <Th>Código</Th>
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
              <Td className="font-mono text-xs text-slate-600">{m.code}</Td>
              <Td className="font-medium">{m.titulo}</Td>
              <Td>{inmuebleDisplayFromId(m.inmuebleId, inmueblesMap)}</Td>
              <Td>
                <StatusBadge
                  label={m.prioridad}
                  variant={
                    m.prioridad === "ALTA"
                      ? "danger"
                      : m.prioridad === "MEDIA"
                        ? "warning"
                        : "neutral"
                  }
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
        title="Nueva solicitud de mantenimiento"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="mnt-form" disabled={pending}>
              Guardar
            </Button>
          </>
        }
      >
        <form id="mnt-form" onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Inmueble">
            <Select name="inmuebleId" defaultValue={inmueblesOptions[0]?.id} required>
              {inmueblesOptions.map((inm) => (
                <option key={inm.id} value={inm.id}>
                  {inmuebleOptionLabel(inm)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Título">
            <Input name="titulo" required />
          </FormField>
          <FormField label="Descripción">
            <Input name="descripcion" required />
          </FormField>
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

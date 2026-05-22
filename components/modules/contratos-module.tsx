"use client";

import {
  actualizarContratoAction,
  crearContratoAction,
  eliminarContratoAction,
} from "@/app/(dashboard)/contratos/actions";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusBadge, estadoVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField, Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { inmuebleOptionLabel, inmueblesById, inmuebleDisplayFromId } from "@/lib/entity-labels";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getModulePermissions } from "@/lib/auth/permissions";
import type { Contrato, EstadoContrato, Inmueble, Rol } from "@/types";
import { listarInmueblesFormAction } from "@/app/(dashboard)/inmuebles/actions";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";

const ESTADOS: EstadoContrato[] = ["ACTIVO", "VENCIDO", "PENDIENTE", "TERMINADO"];

export function ContratosModule({
  initialData,
  inmuebles,
  rol,
  usuarioId,
}: {
  initialData: Contrato[];
  inmuebles: Inmueble[];
  rol: Rol;
  usuarioId: string;
}) {
  const perms = getModulePermissions(rol, "contratos");
  const [inmueblesOptions, setInmueblesOptions] = useState(inmuebles);
  const inmueblesMap = useMemo(() => inmueblesById(inmueblesOptions), [inmueblesOptions]);
  const [items, setItems] = useState(initialData);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contrato | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setInmueblesOptions(inmuebles);
  }, [inmuebles]);

  async function openForm(editingItem: Contrato | null) {
    const fresh = await listarInmueblesFormAction();
    setInmueblesOptions(fresh);
    setEditing(editingItem);
    setOpen(true);
  }

  const filtered = useMemo(
    () =>
      items.filter((c) => {
        const q = search.toLowerCase();
        const matchSearch = !search || c.id.toLowerCase().includes(q) || c.inmuebleId.includes(q);
        const matchEstado = !estadoFilter || c.estado === estadoFilter;
        return matchSearch && matchEstado;
      }),
    [items, search, estadoFilter]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      inmuebleId: fd.get("inmuebleId") as string,
      arrendatarioId: (fd.get("arrendatarioId") as string) || "u-arrendatario",
      arrendadorId: usuarioId,
      fechaInicio: fd.get("fechaInicio") as string,
      fechaFin: fd.get("fechaFin") as string,
      canonMensual: Number(fd.get("canonMensual")),
      estado: fd.get("estado") as EstadoContrato,
      documentoUrl: (fd.get("documentoUrl") as string) || undefined,
    };
    startTransition(async () => {
      if (editing) {
        const updated = await actualizarContratoAction(editing.id, payload);
        if (updated) {
          setItems((prev) => prev.map((i) => (i.id === editing.id ? { ...i, ...updated } : i)));
        }
      } else {
        const created = await crearContratoAction(payload);
        if (created) setItems((prev) => [...prev, created]);
      }
      setOpen(false);
      setEditing(null);
    });
  }

  return (
    <>
      <PageHeader
        title="Contratos"
        description="Contratos de arrendamiento — documentos adjuntos, sin firma digital real"
        action={
          perms.canCreate ? (
            <Button onClick={() => openForm(null)}>
              <Plus className="h-4 w-4" /> Nuevo contrato
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
            <Th>Inmueble</Th>
            <Th>Vigencia</Th>
            <Th>Canon</Th>
            <Th>Estado</Th>
            {(perms.canEdit || perms.canDelete) && <Th className="text-right">Acciones</Th>}
          </tr>
        </thead>
        <tbody>
          {filtered.map((c) => (
            <Tr key={c.id}>
              <Td className="font-mono text-xs text-slate-600">{c.code}</Td>
              <Td>{inmuebleDisplayFromId(c.inmuebleId, inmueblesMap)}</Td>
              <Td>
                {formatDate(c.fechaInicio)} — {formatDate(c.fechaFin)}
              </Td>
              <Td>{formatCurrency(c.canonMensual)}</Td>
              <Td>
                <StatusBadge label={c.estado} variant={estadoVariant(c.estado)} />
              </Td>
              {(perms.canEdit || perms.canDelete) && (
                <Td className="text-right">
                  {perms.canEdit && (
                    <Button variant="ghost" size="sm" onClick={() => openForm(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {perms.canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("¿Eliminar?")) {
                          startTransition(async () => {
                            await eliminarContratoAction(c.id);
                            setItems((p) => p.filter((x) => x.id !== c.id));
                          });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </Td>
              )}
            </Tr>
          ))}
        </tbody>
      </Table>
      <Modal
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        title={editing ? "Editar contrato" : "Nuevo contrato"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" form="ctr-form" disabled={pending}>Guardar</Button>
          </>
        }
      >
        <form
          id="ctr-form"
          key={editing?.id ?? `new-${inmueblesOptions.map((i) => i.id).join(",")}`}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <FormField label="Inmueble">
            <Select
              name="inmuebleId"
              defaultValue={editing?.inmuebleId ?? inmueblesOptions[0]?.id}
              required
            >
              {inmueblesOptions.map((inm) => (
                <option key={inm.id} value={inm.id}>
                  {inmuebleOptionLabel(inm)}
                </option>
              ))}
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Inicio">
              <Input name="fechaInicio" type="date" defaultValue={editing?.fechaInicio} required />
            </FormField>
            <FormField label="Fin">
              <Input name="fechaFin" type="date" defaultValue={editing?.fechaFin} required />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Canon">
              <Input name="canonMensual" type="number" defaultValue={editing?.canonMensual} required />
            </FormField>
            <FormField label="Estado">
              <Select name="estado" defaultValue={editing?.estado ?? "ACTIVO"}>
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </Select>
            </FormField>
          </div>
          <FormField label="URL documento (demo)">
            <Input name="documentoUrl" defaultValue={editing?.documentoUrl} placeholder="/docs/contrato.pdf" />
          </FormField>
        </form>
      </Modal>
    </>
  );
}

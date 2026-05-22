"use client";

import {
  actualizarInmuebleAction,
  crearInmuebleAction,
  eliminarInmuebleAction,
} from "@/app/(dashboard)/inmuebles/actions";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusBadge, estadoVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField, Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { getModulePermissions } from "@/lib/auth/permissions";
import type { EstadoInmueble, Inmueble, Rol } from "@/types";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

const ESTADOS: EstadoInmueble[] = ["DISPONIBLE", "ARRENDADO", "MANTENIMIENTO"];

export function InmueblesModule({
  initialData,
  rol,
  usuarioId,
}: {
  initialData: Inmueble[];
  rol: Rol;
  usuarioId: string;
}) {
  const perms = getModulePermissions(rol, "inmuebles");
  const [items, setItems] = useState(initialData);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Inmueble | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const matchSearch =
        !search ||
        i.titulo.toLowerCase().includes(search.toLowerCase()) ||
        i.ciudad.toLowerCase().includes(search.toLowerCase());
      const matchEstado = !estadoFilter || i.estado === estadoFilter;
      return matchSearch && matchEstado;
    });
  }, [items, search, estadoFilter]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      titulo: fd.get("titulo") as string,
      direccion: fd.get("direccion") as string,
      ciudad: fd.get("ciudad") as string,
      tipo: fd.get("tipo") as string,
      estado: fd.get("estado") as EstadoInmueble,
      canonMensual: Number(fd.get("canonMensual")),
      arrendadorId: usuarioId,
      descripcion: (fd.get("descripcion") as string) || undefined,
    };

    startTransition(async () => {
      if (editing) {
        const updated = await actualizarInmuebleAction(editing.id, payload);
        if (updated) {
          setItems((prev) =>
            prev.map((i) => (i.id === editing.id ? { ...i, ...updated } : i))
          );
        }
      } else {
        const created = await crearInmuebleAction(payload);
        if (created) setItems((prev) => [...prev, created]);
      }
      setOpen(false);
      setEditing(null);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar inmueble?")) return;
    startTransition(async () => {
      await eliminarInmuebleAction(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    });
  }

  return (
    <>
      <PageHeader
        title="Inmuebles"
        description="Gestión de propiedades en arrendamiento activo"
        action={
          perms.canCreate ? (
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Nuevo inmueble
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
        placeholder="Buscar por título o ciudad..."
      />

      <Table>
        <thead>
          <tr>
            <Th>Código</Th>
            <Th>Título</Th>
            <Th>Ciudad</Th>
            <Th>Tipo</Th>
            <Th>Canon</Th>
            <Th>Estado</Th>
            {(perms.canEdit || perms.canDelete) && (
              <Th className="text-right">Acciones</Th>
            )}
          </tr>
        </thead>
        <tbody>
          {filtered.map((i) => (
            <Tr key={i.id}>
              <Td className="font-mono text-xs text-slate-600">{i.code}</Td>
              <Td className="font-medium text-slate-900">{i.titulo}</Td>
              <Td>{i.ciudad}</Td>
              <Td>{i.tipo}</Td>
              <Td>{formatCurrency(i.canonMensual)}</Td>
              <Td>
                <StatusBadge label={i.estado} variant={estadoVariant(i.estado)} />
              </Td>
              {(perms.canEdit || perms.canDelete) && (
                <Td className="text-right">
                  <div className="flex justify-end gap-1">
                    {perms.canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditing(i);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {perms.canDelete && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(i.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </Td>
              )}
            </Tr>
          ))}
        </tbody>
      </Table>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        title={editing ? "Editar inmueble" : "Nuevo inmueble"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="inmueble-form" disabled={pending}>
              {pending ? "Guardando..." : "Guardar"}
            </Button>
          </>
        }
      >
        <form id="inmueble-form" onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Título">
            <Input name="titulo" defaultValue={editing?.titulo} required />
          </FormField>
          <FormField label="Dirección">
            <Input name="direccion" defaultValue={editing?.direccion} required />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Ciudad">
              <Input name="ciudad" defaultValue={editing?.ciudad} required />
            </FormField>
            <FormField label="Tipo">
              <Input name="tipo" defaultValue={editing?.tipo ?? "Apartamento"} required />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Canon mensual">
              <Input
                name="canonMensual"
                type="number"
                defaultValue={editing?.canonMensual ?? 0}
                required
              />
            </FormField>
            <FormField label="Estado">
              <Select name="estado" defaultValue={editing?.estado ?? "DISPONIBLE"}>
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <FormField label="Descripción">
            <Input name="descripcion" defaultValue={editing?.descripcion} />
          </FormField>
        </form>
      </Modal>
    </>
  );
}

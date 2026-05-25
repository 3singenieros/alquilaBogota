"use client";

import {
  actualizarInmuebleAction,
  crearInmuebleAction,
  eliminarInmuebleAction,
} from "@/app/(dashboard)/inmuebles/actions";
import { listarHistorialInmuebleAction } from "@/app/(dashboard)/trazabilidad/actions";
import { HistorialTimeline } from "@/components/trazabilidad/historial-timeline";
import { ArrendadorSinInmueblesState } from "@/components/shared/arrendatario-sin-vinculos-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusBadge, estadoVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField, Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import {
  CIUDAD_PROTOTIPO,
  ESTRATOS_INMUEBLE,
  LOCALIDADES_BOGOTA,
} from "@/lib/inmueble-ubicacion";
import { getModulePermissions } from "@/lib/auth/permissions";
import type { EstadoInmueble, Inmueble, Rol } from "@/types";
import type { EventoTrazabilidad } from "@/types/trazabilidad";
import { History, Pencil, Plus, Trash2 } from "lucide-react";
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
  const [localidadFilter, setLocalidadFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Inmueble | null>(null);
  const [pending, startTransition] = useTransition();
  const [historialOpen, setHistorialOpen] = useState(false);
  const [historialEventos, setHistorialEventos] = useState<EventoTrazabilidad[]>([]);
  const [historialTitulo, setHistorialTitulo] = useState("");

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        i.titulo.toLowerCase().includes(q) ||
        (i.localidad?.toLowerCase().includes(q) ?? false) ||
        (i.barrio?.toLowerCase().includes(q) ?? false) ||
        i.direccion.toLowerCase().includes(q);
      const matchEstado = !estadoFilter || i.estado === estadoFilter;
      const matchLocalidad = !localidadFilter || i.localidad === localidadFilter;
      return matchSearch && matchEstado && matchLocalidad;
    });
  }, [items, search, estadoFilter, localidadFilter]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      titulo: fd.get("titulo") as string,
      direccion: fd.get("direccion") as string,
      ciudad: CIUDAD_PROTOTIPO,
      localidad: (fd.get("localidad") as string) || undefined,
      barrio: (fd.get("barrio") as string) || undefined,
      estrato: fd.get("estrato") ? Number(fd.get("estrato")) : undefined,
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
        pageTestId="page-inmuebles"
        title="Inmuebles"
        description="Gestión de propiedades en arrendamiento activo — alcance Bogotá D.C."
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

      {items.length === 0 ? (
        <ArrendadorSinInmueblesState />
      ) : (
        <>
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        estado={estadoFilter}
        onEstadoChange={setEstadoFilter}
        estados={ESTADOS.map((e) => ({ value: e, label: e }))}
        placeholder="Buscar por título, localidad, barrio o dirección..."
      />
      <div className="mb-4 max-w-xs">
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Filtrar por localidad
        </label>
        <Select
          value={localidadFilter}
          onChange={(e) => setLocalidadFilter(e.target.value)}
        >
          <option value="">Todas las localidades</option>
          {LOCALIDADES_BOGOTA.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </Select>
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Código</Th>
            <Th>Título</Th>
            <Th>Localidad</Th>
            <Th>Barrio</Th>
            <Th>Tipo</Th>
            <Th>Canon</Th>
            <Th>Estado</Th>
            <Th className="text-right">Acciones</Th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((i) => (
            <Tr key={i.id}>
              <Td className="font-mono text-xs text-slate-600">{i.code}</Td>
              <Td className="font-medium text-slate-900">{i.titulo}</Td>
              <Td>{i.localidad ?? "—"}</Td>
              <Td>{i.barrio ?? "—"}</Td>
              <Td>{i.tipo}</Td>
              <Td>{formatCurrency(i.canonMensual)}</Td>
              <Td>
                <StatusBadge label={i.estado} variant={estadoVariant(i.estado)} />
              </Td>
              <Td className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Ver historial"
                      onClick={() => {
                        startTransition(async () => {
                          const eventos = await listarHistorialInmuebleAction(i.id);
                          setHistorialEventos(eventos);
                          setHistorialTitulo(i.titulo);
                          setHistorialOpen(true);
                        });
                      }}
                    >
                      <History className="h-4 w-4" />
                    </Button>
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
            </Tr>
          ))}
        </tbody>
      </Table>
        </>
      )}

      <Modal
        open={historialOpen}
        onClose={() => setHistorialOpen(false)}
        title={`Historial — ${historialTitulo}`}
        footer={
          <Button variant="secondary" onClick={() => setHistorialOpen(false)}>
            Cerrar
          </Button>
        }
      >
        <HistorialTimeline eventos={historialEventos} />
      </Modal>

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
          <FormField label="Ciudad">
            <Input name="ciudad" value={CIUDAD_PROTOTIPO} readOnly disabled />
            <p className="mt-1 text-xs text-slate-500">
              Actualmente el prototipo está delimitado para Bogotá D.C. La estructura queda
              preparada para futuras expansiones a otras ciudades.
            </p>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Localidad">
              <Select name="localidad" defaultValue={editing?.localidad ?? ""}>
                <option value="">Seleccionar localidad</option>
                {LOCALIDADES_BOGOTA.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Barrio">
              <Input name="barrio" defaultValue={editing?.barrio ?? ""} placeholder="Opcional" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Estrato">
              <Select name="estrato" defaultValue={editing?.estrato?.toString() ?? ""}>
                <option value="">Sin especificar</option>
                {ESTRATOS_INMUEBLE.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </Select>
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

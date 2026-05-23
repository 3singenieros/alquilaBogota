"use client";

import {
  actualizarUsuarioAction,
  crearUsuarioAction,
  eliminarUsuarioAction,
} from "@/app/(dashboard)/usuarios/actions";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField, Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { getModulePermissions } from "@/lib/auth/permissions";
import type { Rol, Usuario } from "@/types";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

const ROLES: Rol[] = ["ADMIN", "ARRENDADOR", "ARRENDATARIO"];

export function UsuariosModule({
  initialData,
  rol,
}: {
  initialData: Usuario[];
  rol: Rol;
}) {
  const perms = getModulePermissions(rol, "usuarios");
  const [items, setItems] = useState(initialData);
  const [search, setSearch] = useState("");
  const [rolFilter, setRolFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(
    () =>
      items.filter((u) => {
        const q = search.toLowerCase();
        const matchSearch =
          !search || u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
        const matchRol = !rolFilter || u.rol === rolFilter;
        return matchSearch && matchRol;
      }),
    [items, search, rolFilter]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const rol = fd.get("rol") as Rol;
    const payload = {
      nombre: fd.get("nombre") as string,
      email: fd.get("email") as string,
      rol,
      roles: [rol],
      rolActivo: rol,
      perfilCompletado: true,
      telefono: (fd.get("telefono") as string) || undefined,
      activo: fd.get("activo") === "true",
    };
    startTransition(async () => {
      if (editing) {
        const updated = await actualizarUsuarioAction(editing.id, payload);
        if (updated) {
          setItems((prev) => prev.map((u) => (u.id === editing.id ? { ...u, ...updated } : u)));
        }
      } else {
        const created = await crearUsuarioAction(payload);
        if (created) setItems((prev) => [...prev, created]);
      }
      setOpen(false);
      setEditing(null);
    });
  }

  return (
    <>
      <PageHeader
        title="Usuarios y roles"
        description="Gestión de usuarios — auth real vía Supabase en fase posterior"
        action={
          perms.canCreate ? (
            <Button onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="h-4 w-4" /> Nuevo usuario
            </Button>
          ) : undefined
        }
      />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        estado={rolFilter}
        onEstadoChange={setRolFilter}
        estados={ROLES.map((r) => ({ value: r, label: r }))}
        placeholder="Nombre o email..."
      />
      <Table>
        <thead>
          <tr>
            <Th>Código</Th>
            <Th>Nombre</Th>
            <Th>Email</Th>
            <Th>Rol</Th>
            <Th>Estado</Th>
            {(perms.canEdit || perms.canDelete) && (
              <Th className="text-right">Acciones</Th>
            )}
          </tr>
        </thead>
        <tbody>
          {filtered.map((u) => (
            <Tr key={u.id}>
              <Td className="font-mono text-xs text-slate-600">{u.code}</Td>
              <Td className="font-medium">{u.nombre}</Td>
              <Td>{u.email}</Td>
              <Td>
                <StatusBadge
                  label={u.rol}
                  variant={u.rol === "ADMIN" ? "primary" : u.rol === "ARRENDADOR" ? "info" : "neutral"}
                />
              </Td>
              <Td>
                <StatusBadge label={u.activo ? "Activo" : "Inactivo"} variant={u.activo ? "success" : "danger"} />
              </Td>
              {(perms.canEdit || perms.canDelete) && (
                <Td className="text-right">
                  {perms.canEdit && (
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(u); setOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {perms.canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("¿Eliminar usuario?")) {
                          startTransition(async () => {
                            await eliminarUsuarioAction(u.id);
                            setItems((p) => p.filter((x) => x.id !== u.id));
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
        title={editing ? "Editar usuario" : "Nuevo usuario"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" form="user-form" disabled={pending}>Guardar</Button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nombre"><Input name="nombre" defaultValue={editing?.nombre} required /></FormField>
          <FormField label="Email"><Input name="email" type="email" defaultValue={editing?.email} required /></FormField>
          <FormField label="Teléfono"><Input name="telefono" defaultValue={editing?.telefono} /></FormField>
          <FormField label="Rol">
            <Select name="rol" defaultValue={editing?.rol ?? "ARRENDATARIO"}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </Select>
          </FormField>
          <FormField label="Activo">
            <Select name="activo" defaultValue={editing?.activo !== false ? "true" : "false"}>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </Select>
          </FormField>
        </form>
      </Modal>
    </>
  );
}

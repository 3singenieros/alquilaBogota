"use client";

import { addRoleAction } from "@/app/profile/actions";
import { Button } from "@/components/ui/button";
import { FormField, Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Rol, TipoDocumento, Usuario } from "@/types";
import type { UserProfile } from "@/types/profile";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const TIPOS_DOC: TipoDocumento[] = ["CC", "CE", "NIT", "PASAPORTE", "OTRO"];

const ROL_LABEL: Record<Rol, string> = {
  ADMIN: "Administrador",
  ARRENDADOR: "Arrendador",
  ARRENDATARIO: "Arrendatario",
};

export function AddRoleModal({
  open,
  onClose,
  role,
  profile,
  usuario,
}: {
  open: boolean;
  onClose: () => void;
  role: Rol;
  profile: UserProfile | null;
  usuario: Usuario;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [setAsActive, setSetAsActive] = useState(true);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await addRoleAction(
          role,
          {
            tipoDocumento: fd.get("tipoDocumento") as TipoDocumento,
            numeroDocumento: fd.get("numeroDocumento") as string,
            telefono: fd.get("telefono") as string,
            direccionNotificaciones: fd.get("direccionNotificaciones") as string,
            correoNotificaciones: fd.get("correoNotificaciones") as string,
          },
          setAsActive
        );
        onClose();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo agregar el rol.");
      }
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Agregar rol ${ROL_LABEL[role]}`}
    >
      <p className="mb-4 text-sm text-slate-600">
        Completa los datos mínimos para ejercer este rol en la plataforma.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <FormField label="Tipo de documento">
          <Select name="tipoDocumento" defaultValue={profile?.tipoDocumento ?? "CC"} required>
            {TIPOS_DOC.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Número de documento">
          <Input
            name="numeroDocumento"
            defaultValue={profile?.numeroDocumento ?? ""}
            required
          />
        </FormField>
        <FormField label="Teléfono">
          <Input
            name="telefono"
            defaultValue={profile?.telefono ?? usuario.telefono ?? ""}
            required
          />
        </FormField>
        <FormField label="Dirección de notificaciones">
          <Input
            name="direccionNotificaciones"
            defaultValue={profile?.direccionNotificaciones ?? ""}
            placeholder="Calle, ciudad"
            required
          />
        </FormField>
        <FormField label="Correo autorizado de notificaciones">
          <Input
            name="correoNotificaciones"
            type="email"
            defaultValue={profile?.correoNotificaciones ?? usuario.email}
            required
          />
        </FormField>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={setAsActive}
            onChange={(e) => setSetAsActive(e.target.checked)}
            className="rounded border-slate-300"
          />
          Usar {ROL_LABEL[role]} como rol activo
        </label>
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : "Agregar rol"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

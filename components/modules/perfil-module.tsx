"use client";

import {
  updateActiveRoleAction,
  updateProfileAction,
} from "@/app/profile/actions";
import { AddRoleModal } from "@/components/profile/add-role-modal";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { ROLES_ONBOARDING } from "@/lib/auth/profile-session";
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

export function PerfilModule({
  profile,
  usuario,
}: {
  profile: UserProfile;
  usuario: Usuario;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addRole, setAddRole] = useState<Rol | null>(null);

  const missingRoles = ROLES_ONBOARDING.filter((r) => !profile.roles.includes(r));

  function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateProfileAction({
          nombre: fd.get("nombre") as string,
          telefono: fd.get("telefono") as string,
          tipoDocumento: fd.get("tipoDocumento") as TipoDocumento,
          numeroDocumento: fd.get("numeroDocumento") as string,
          direccionNotificaciones: fd.get("direccionNotificaciones") as string,
          correoNotificaciones: fd.get("correoNotificaciones") as string,
        });
        setMessage("Perfil actualizado correctamente.");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo guardar.");
      }
    });
  }

  function changeActiveRole(role: Rol) {
    if (role === profile.rolActivo) return;
    startTransition(async () => {
      await updateActiveRoleAction(role);
      router.refresh();
    });
  }

  return (
    <>
      <PageHeader
        title="Mi perfil"
        description="Administra tus datos personales y roles en la plataforma"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">Datos personales</h2>
          <form onSubmit={saveProfile} className="mt-4 space-y-4">
            <FormField label="Nombre">
              <Input name="nombre" defaultValue={profile.nombre} required />
            </FormField>
            <FormField label="Email">
              <Input value={profile.email} disabled />
            </FormField>
            <FormField label="Tipo de documento">
              <Select name="tipoDocumento" defaultValue={profile.tipoDocumento ?? "CC"}>
                {TIPOS_DOC.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Número de documento">
              <Input name="numeroDocumento" defaultValue={profile.numeroDocumento ?? ""} />
            </FormField>
            <FormField label="Teléfono">
              <Input name="telefono" defaultValue={profile.telefono ?? ""} />
            </FormField>
            <FormField label="Dirección de notificaciones">
              <Input
                name="direccionNotificaciones"
                defaultValue={profile.direccionNotificaciones ?? ""}
              />
            </FormField>
            <FormField label="Correo autorizado de notificaciones">
              <Input
                name="correoNotificaciones"
                type="email"
                defaultValue={profile.correoNotificaciones ?? profile.email}
              />
            </FormField>
            {message ? (
              <p className="text-sm text-emerald-700">{message}</p>
            ) : null}
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </form>
        </section>

        <section className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">Roles de usuario</h2>
          <p className="mt-1 text-xs text-slate-500">
            Puedes tener varios roles y cambiar el activo sin repetir onboarding.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {profile.roles.map((r) => (
              <StatusBadge
                key={r}
                label={ROL_LABEL[r]}
                variant={r === profile.rolActivo ? "primary" : "neutral"}
              />
            ))}
          </div>

          {profile.roles.length > 1 && !profile.roles.every((r) => r === "ADMIN") ? (
            <FormField label="Rol activo" className="mt-4">
              <Select
                value={profile.rolActivo}
                disabled={pending}
                onChange={(e) => changeActiveRole(e.target.value as Rol)}
              >
                {profile.roles.map((r) => (
                  <option key={r} value={r}>
                    {ROL_LABEL[r]}
                  </option>
                ))}
              </Select>
            </FormField>
          ) : (
            <p className="mt-4 text-sm text-slate-600">
              Rol activo: <strong>{ROL_LABEL[profile.rolActivo]}</strong>
            </p>
          )}

          <div className="mt-6 space-y-2">
            {missingRoles.includes("ARRENDADOR") ? (
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => setAddRole("ARRENDADOR")}
              >
                Agregar rol arrendador
              </Button>
            ) : null}
            {missingRoles.includes("ARRENDATARIO") ? (
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => setAddRole("ARRENDATARIO")}
              >
                Agregar rol arrendatario
              </Button>
            ) : null}
            {missingRoles.length === 0 && !profile.roles.includes("ADMIN") ? (
              <p className="text-xs text-slate-500">
                Ya tienes todos los roles disponibles para usuarios de la plataforma.
              </p>
            ) : null}
          </div>
        </section>
      </div>

      {addRole ? (
        <AddRoleModal
          open={Boolean(addRole)}
          onClose={() => setAddRole(null)}
          role={addRole}
          profile={profile}
          usuario={usuario}
        />
      ) : null}
    </>
  );
}

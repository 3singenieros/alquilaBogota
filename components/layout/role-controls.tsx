"use client";

import { updateActiveRoleAction } from "@/app/profile/actions";
import { AddRoleModal } from "@/components/profile/add-role-modal";
import { ROLES_ONBOARDING } from "@/lib/auth/profile-session";
import type { Rol, Usuario } from "@/types";
import type { UserProfile } from "@/types/profile";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const ROL_LABEL: Record<Rol, string> = {
  ADMIN: "Administrador",
  ARRENDADOR: "Arrendador",
  ARRENDATARIO: "Arrendatario",
};

export function RoleControls({
  usuario,
  profile,
}: {
  usuario: Usuario;
  profile?: UserProfile | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [addRole, setAddRole] = useState<Rol | null>(null);
  const roles = usuario.roles ?? [usuario.rol];
  const missingRoles = ROLES_ONBOARDING.filter((r) => !roles.includes(r));

  function onChangeRolActivo(role: Rol) {
    if (role === usuario.rolActivo) return;
    startTransition(async () => {
      await updateActiveRoleAction(role);
      router.refresh();
    });
  }

  const roleModal = addRole ? (
    <AddRoleModal
      open
      onClose={() => setAddRole(null)}
      role={addRole}
      profile={profile ?? null}
      usuario={usuario}
    />
  ) : null;

  if (roles.length > 1 && !roles.every((r) => r === "ADMIN")) {
    const switchable = roles.filter((r) => r !== "ADMIN" || roles.length === 1);
    return (
      <>
        <div className="flex flex-col items-end gap-1">
          <label className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            Rol activo
          </label>
          <select
            value={usuario.rolActivo}
            disabled={pending}
            onChange={(e) => onChangeRolActivo(e.target.value as Rol)}
            className="rounded-lg border border-[var(--border)] bg-white px-2 py-1 text-xs font-medium text-slate-800"
          >
            {switchable.map((r) => (
              <option key={r} value={r}>
                {ROL_LABEL[r]}
              </option>
            ))}
            {roles.includes("ADMIN") ? (
              <option value="ADMIN">{ROL_LABEL.ADMIN}</option>
            ) : null}
          </select>
          {missingRoles.length > 0 ? (
            <AddRoleLinks missing={missingRoles} pending={pending} onAdd={setAddRole} />
          ) : null}
          <Link href="/perfil" className="text-[10px] text-indigo-600 hover:underline">
            Mi perfil
          </Link>
        </div>
        {roleModal}
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
          {ROL_LABEL[usuario.rolActivo ?? usuario.rol]}
        </span>
        {missingRoles.length > 0 ? (
          <AddRoleLinks missing={missingRoles} pending={pending} onAdd={setAddRole} />
        ) : null}
        <Link href="/perfil" className="text-[10px] text-indigo-600 hover:underline">
          Mi perfil
        </Link>
      </div>
      {roleModal}
    </>
  );
}

function AddRoleLinks({
  missing,
  pending,
  onAdd,
}: {
  missing: Rol[];
  pending: boolean;
  onAdd: (role: Rol) => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2 text-[10px]">
      {missing.includes("ARRENDADOR") ? (
        <button
          type="button"
          disabled={pending}
          className="text-indigo-600 hover:underline"
          onClick={() => onAdd("ARRENDADOR")}
        >
          + Arrendador
        </button>
      ) : null}
      {missing.includes("ARRENDATARIO") ? (
        <button
          type="button"
          disabled={pending}
          className="text-indigo-600 hover:underline"
          onClick={() => onAdd("ARRENDATARIO")}
        >
          + Arrendatario
        </button>
      ) : null}
    </div>
  );
}

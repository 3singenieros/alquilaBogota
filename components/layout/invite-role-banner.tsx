"use client";

import { addRoleAction } from "@/app/profile/actions";
import type { Rol } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function InviteRoleBanner({
  pendingCount,
  hasArrendatarioRole,
}: {
  pendingCount: number;
  hasArrendatarioRole: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (pendingCount === 0) return null;

  if (hasArrendatarioRole) {
    return (
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900 md:px-6">
        Tienes {pendingCount} invitación{pendingCount > 1 ? "es" : ""} de contrato
        pendiente{pendingCount > 1 ? "s" : ""}.{" "}
        <Link href="/solicitudes-contrato" className="font-medium underline">
          Ver solicitudes
        </Link>
      </div>
    );
  }

  function agregarArrendatario() {
    startTransition(async () => {
      await addRoleAction("ARRENDATARIO" as Rol);
      router.refresh();
    });
  }

  return (
    <div className="border-b border-indigo-200 bg-indigo-50 px-4 py-2 text-center text-sm text-indigo-900 md:px-6">
      Tienes {pendingCount} invitación{pendingCount > 1 ? "es" : ""} de contrato en tu
      correo, pero tu rol activo es solo arrendador.{" "}
      <button
        type="button"
        disabled={pending}
        className="font-medium underline"
        onClick={agregarArrendatario}
      >
        Agregar rol arrendatario
      </button>{" "}
      para ver y responder solicitudes.
    </div>
  );
}

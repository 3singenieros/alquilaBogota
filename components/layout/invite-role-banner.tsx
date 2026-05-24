"use client";

import Link from "next/link";

export function InviteRoleBanner({
  pendingCount,
  hasArrendatarioRole,
}: {
  pendingCount: number;
  hasArrendatarioRole: boolean;
}) {
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

  return (
    <div className="border-b border-indigo-200 bg-indigo-50 px-4 py-2 text-center text-sm text-indigo-900 md:px-6">
      Tienes {pendingCount} invitación{pendingCount > 1 ? "es" : ""} de contrato en tu
      correo, pero tu rol activo es solo arrendador.{" "}
      <Link href="/perfil" className="font-medium underline">
        Agrega el rol arrendatario desde tu perfil
      </Link>{" "}
      para ver y responder solicitudes.
    </div>
  );
}

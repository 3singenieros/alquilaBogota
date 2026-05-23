"use client";

import { InviteRoleBanner } from "@/components/layout/invite-role-banner";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import type { Usuario } from "@/types";
import { useState, type ReactNode } from "react";

export function AppShell({
  children,
  usuario,
  pendingInviteCount = 0,
}: {
  children: ReactNode;
  usuario: Usuario;
  pendingInviteCount?: number;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const roles = usuario.roles ?? [usuario.rol];
  const hasArrendatarioRole = roles.includes("ARRENDATARIO");

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        rolActivo={usuario.rolActivo ?? usuario.rol}
        roles={roles}
      />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-0">
        <InviteRoleBanner
          pendingCount={pendingInviteCount}
          hasArrendatarioRole={hasArrendatarioRole}
        />
        <Topbar onMenuClick={() => setSidebarOpen(true)} usuario={usuario} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

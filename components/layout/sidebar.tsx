"use client";

import { NAV_ITEMS } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";
import type { Rol } from "@/types";
import {
  Building2,
  FileText,
  Hammer,
  LayoutDashboard,
  Receipt,
  Users,
  XCircle,
  Zap,
  Bell,
  Inbox,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONS: Record<string, LucideIcon> = {
  "/": LayoutDashboard,
  "/inmuebles": Building2,
  "/contratos": FileText,
  "/pagos": Receipt,
  "/servicios": Zap,
  "/mantenimiento": Hammer,
  "/no-renovacion": XCircle,
  "/notificaciones": Bell,
  "/solicitudes-contrato": Inbox,
  "/usuarios": Users,
};

function navLabel(href: string, label: string, rolActivo: Rol): string {
  if (href === "/solicitudes-contrato" && rolActivo === "ARRENDATARIO") {
    return "Mis contratos / Solicitudes";
  }
  return label;
}

export function Sidebar({
  open,
  onClose,
  rolActivo,
  roles,
}: {
  open: boolean;
  onClose: () => void;
  rolActivo: Rol;
  roles: Rol[];
}) {
  const pathname = usePathname();
  const nav = NAV_ITEMS.filter((item) => {
    if (!item.roles.includes(rolActivo)) return false;
    if (item.href === "/contratos" && roles.includes("ARRENDATARIO") && !roles.includes("ARRENDADOR") && rolActivo === "ARRENDATARIO") {
      return false;
    }
    return true;
  });

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[var(--border)] bg-[var(--sidebar)] transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-[var(--border)] px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <span className="text-sm font-bold">AB</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">AlquilaBogotá</p>
            <p className="text-xs text-slate-500">MVP académico</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map(({ href, label }) => {
            const active = pathname === href;
            const Icon = ICONS[href] ?? LayoutDashboard;
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {navLabel(href, label, rolActivo)}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[var(--border)] p-4 text-xs text-slate-500">
          Rol activo: {rolActivo}
        </div>
      </aside>
    </>
  );
}

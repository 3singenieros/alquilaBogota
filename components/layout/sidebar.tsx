"use client";

import { cn } from "@/lib/utils";
import {
  Building2,
  ClipboardList,
  FileText,
  Hammer,
  LayoutDashboard,
  Receipt,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inmuebles", label: "Inmuebles", icon: Building2 },
  { href: "/contratos", label: "Contratos", icon: FileText },
  { href: "/pagos", label: "Pagos reportados", icon: Receipt },
  { href: "/servicios", label: "Servicios públicos", icon: Zap },
  { href: "/mantenimiento", label: "Mantenimiento", icon: Hammer },
  { href: "/no-renovacion", label: "No renovación", icon: XCircle },
  { href: "/usuarios", label: "Usuarios y roles", icon: Users },
];

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

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
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Arriendos</p>
            <p className="text-xs text-slate-500">MVP Académico</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
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
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[var(--border)] p-4 text-xs text-slate-500">
          Prototipo tesis — datos demo
        </div>
      </aside>
    </>
  );
}

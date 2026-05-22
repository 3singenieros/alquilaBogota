"use client";

import { useRole } from "@/components/providers/role-provider";
import { Select } from "@/components/ui/select";
import { Menu, Search } from "lucide-react";
import type { Rol } from "@/types";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { rol, usuario, setRol } = useRole();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-[var(--border)] bg-white/80 px-4 backdrop-blur md:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          placeholder="Buscar inmuebles, contratos..."
          className="w-full rounded-lg border border-[var(--border)] bg-slate-50 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden sm:block">
          <label className="sr-only">Rol demo</label>
          <Select
            value={rol}
            onChange={(e) => setRol(e.target.value as Rol)}
            className="w-40"
          >
            <option value="ADMIN">ADMIN</option>
            <option value="ARRENDADOR">ARRENDADOR</option>
            <option value="ARRENDATARIO">ARRENDATARIO</option>
          </Select>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
            {usuario.nombre.charAt(0)}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium text-slate-900">{usuario.nombre}</p>
            <p className="text-xs text-slate-500">{usuario.rol}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

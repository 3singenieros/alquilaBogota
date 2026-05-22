"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Search } from "lucide-react";

export function FilterBar({
  search,
  onSearchChange,
  estado,
  onEstadoChange,
  estados,
  placeholder = "Buscar...",
}: {
  search: string;
  onSearchChange: (v: string) => void;
  estado: string;
  onEstadoChange: (v: string) => void;
  estados: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          className="pl-10"
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <Select
        className="sm:w-48"
        value={estado}
        onChange={(e) => onEstadoChange(e.target.value)}
      >
        <option value="">Todos los estados</option>
        {estados.map((e) => (
          <option key={e.value} value={e.value}>
            {e.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

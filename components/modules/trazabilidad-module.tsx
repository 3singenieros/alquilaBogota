"use client";

import { FilterBar } from "@/components/shared/filter-bar";
import { TrazabilidadVaciaState } from "@/components/shared/arrendatario-sin-vinculos-state";
import { StatusBadge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type {
  AccionTrazabilidad,
  EntidadTipoTrazabilidad,
  EventoTrazabilidad,
  RolAuditoria,
} from "@/types/trazabilidad";
import { useMemo, useState } from "react";

const ENTIDADES: EntidadTipoTrazabilidad[] = [
  "CONTRATO",
  "INMUEBLE",
  "PAGO",
  "SERVICIO_PUBLICO",
  "PAGO_SERVICIO_PUBLICO",
  "MANTENIMIENTO",
  "NO_RENOVACION",
  "NOTIFICACION",
  "SOPORTE_PAGO",
  "INVITACION_CONTRATO",
  "USUARIO",
];

const ROLES: RolAuditoria[] = ["ADMIN", "ARRENDADOR", "ARRENDATARIO", "SISTEMA"];

export function TrazabilidadModule({
  initialData,
  showEmptyHint = false,
}: {
  initialData: EventoTrazabilidad[];
  showEmptyHint?: boolean;
}) {
  const [items] = useState(initialData);
  const [search, setSearch] = useState("");
  const [entidadFilter, setEntidadFilter] = useState("");
  const [accionFilter, setAccionFilter] = useState("");
  const [contratoFilter, setContratoFilter] = useState("");
  const [inmuebleFilter, setInmuebleFilter] = useState("");
  const [rolFilter, setRolFilter] = useState("");

  const accionesUnicas = useMemo(() => {
    const set = new Set<AccionTrazabilidad>();
    items.forEach((e) => set.add(e.accion));
    return [...set].sort();
  }, [items]);

  const filtered = useMemo(
    () =>
      items.filter((e) => {
        const q = search.toLowerCase();
        const matchSearch =
          !search ||
          e.descripcion.toLowerCase().includes(q) ||
          e.usuarioNombre.toLowerCase().includes(q) ||
          e.entidadId.toLowerCase().includes(q);
        const matchEntidad = !entidadFilter || e.entidadTipo === entidadFilter;
        const matchAccion = !accionFilter || e.accion === accionFilter;
        const matchContrato =
          !contratoFilter || (e.contratoId ?? "").includes(contratoFilter);
        const matchInmueble =
          !inmuebleFilter || (e.inmuebleId ?? "").includes(inmuebleFilter);
        const matchRol = !rolFilter || e.usuarioRol === rolFilter;
        return (
          matchSearch &&
          matchEntidad &&
          matchAccion &&
          matchContrato &&
          matchInmueble &&
          matchRol
        );
      }),
    [
      items,
      search,
      entidadFilter,
      accionFilter,
      contratoFilter,
      inmuebleFilter,
      rolFilter,
    ]
  );

  return (
    <>
      <PageHeader
        title="Trazabilidad"
        description="Bitácora de eventos y cambios de estado — preparada para reportes por contrato o inmueble"
      />
      {showEmptyHint && items.length === 0 ? (
        <TrazabilidadVaciaState />
      ) : (
        <>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          placeholder="Filtrar contratoId (ej. ctr-1)"
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          value={contratoFilter}
          onChange={(e) => setContratoFilter(e.target.value)}
        />
        <input
          placeholder="Filtrar inmuebleId (ej. inm-1)"
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          value={inmuebleFilter}
          onChange={(e) => setInmuebleFilter(e.target.value)}
        />
        <select
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          value={entidadFilter}
          onChange={(e) => setEntidadFilter(e.target.value)}
        >
          <option value="">Todas las entidades</option>
          {ENTIDADES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          value={accionFilter}
          onChange={(e) => setAccionFilter(e.target.value)}
        >
          <option value="">Todas las acciones</option>
          {accionesUnicas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        estado={rolFilter}
        onEstadoChange={setRolFilter}
        estados={ROLES.map((r) => ({ value: r, label: r }))}
        placeholder="Buscar en descripción, usuario o id..."
      />
      <Table>
        <thead>
          <tr>
            <Th>Fecha</Th>
            <Th>Entidad</Th>
            <Th>Id</Th>
            <Th>Contrato</Th>
            <Th>Inmueble</Th>
            <Th>Acción</Th>
            <Th>Estados</Th>
            <Th>Usuario</Th>
            <Th>Descripción</Th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <Td colSpan={9} className="text-center text-sm text-slate-500">
                No hay eventos con estos filtros.
              </Td>
            </tr>
          ) : (
            filtered.map((e) => (
              <Tr key={e.id}>
                <Td className="whitespace-nowrap text-xs">
                  {formatDate(e.fechaHora.slice(0, 10))}
                  <br />
                  <span className="text-slate-400">
                    {e.fechaHora.includes("T") ? e.fechaHora.slice(11, 19) : ""}
                  </span>
                </Td>
                <Td className="text-xs">{e.entidadTipo}</Td>
                <Td className="font-mono text-xs">{e.entidadId}</Td>
                <Td className="font-mono text-xs">{e.contratoId ?? "—"}</Td>
                <Td className="font-mono text-xs">{e.inmuebleId ?? "—"}</Td>
                <Td>
                  <StatusBadge label={e.accion} variant="primary" />
                </Td>
                <Td className="text-xs">
                  {e.estadoAnterior && e.estadoNuevo
                    ? `${e.estadoAnterior} → ${e.estadoNuevo}`
                    : "—"}
                </Td>
                <Td className="text-xs">
                  {e.usuarioNombre}
                  <br />
                  <span className="text-slate-500">{e.usuarioRol}</span>
                </Td>
                <Td className="max-w-xs text-sm">{e.descripcion}</Td>
              </Tr>
            ))
          )}
        </tbody>
      </Table>
        </>
      )}
    </>
  );
}

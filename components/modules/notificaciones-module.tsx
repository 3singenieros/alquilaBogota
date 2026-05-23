"use client";

import { simularEnvioNotificacionAction } from "@/app/(dashboard)/notificaciones/actions";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusBadge, estadoVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { EstadoNotificacion, Notificacion, TipoNotificacion } from "@/types";
import { Mail } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

const TIPOS: TipoNotificacion[] = [
  "INVITACION_CONTRATO",
  "CONTRATO_ACEPTADO",
  "CONTRATO_RECHAZADO",
  "CONTRATO_PROXIMO_VENCER",
  "NO_RENOVACION",
  "PAGO_REPORTADO",
  "SERVICIO_VENCIDO",
  "MANTENIMIENTO",
  "REAJUSTE_CANON",
];

const ESTADOS: EstadoNotificacion[] = ["PENDIENTE", "SIMULADA", "ERROR"];

export function NotificacionesModule({
  initialData,
}: {
  initialData: Notificacion[];
}) {
  const [items, setItems] = useState(initialData);
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((n) => {
      const matchSearch =
        !search ||
        n.destinatarioNombre.toLowerCase().includes(q) ||
        n.destinatarioEmail.toLowerCase().includes(q) ||
        n.asunto.toLowerCase().includes(q);
      const matchTipo = !tipoFilter || n.tipo === tipoFilter;
      const matchEstado = !estadoFilter || n.estado === estadoFilter;
      return matchSearch && matchTipo && matchEstado;
    });
  }, [items, search, tipoFilter, estadoFilter]);

  function simular(id: string) {
    startTransition(async () => {
      const updated = await simularEnvioNotificacionAction(id);
      if (updated) {
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, ...updated } : n)));
      }
    });
  }

  return (
    <>
      <PageHeader
        title="Historial de notificaciones"
        description="Envío simulado — sin correo real; trazabilidad para la tesis"
      />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        estado={estadoFilter}
        onEstadoChange={setEstadoFilter}
        estados={ESTADOS.map((e) => ({ value: e, label: e }))}
        placeholder="Buscar destinatario o asunto..."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <select
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
        >
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <Table>
        <thead>
          <tr>
            <Th>Tipo</Th>
            <Th>Destinatario</Th>
            <Th>Asunto</Th>
            <Th>Estado</Th>
            <Th>Creación</Th>
            <Th>Envío simulado</Th>
            <Th className="text-right">Acción</Th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((n) => (
            <Tr key={n.id}>
              <Td className="text-xs font-medium text-slate-700">{n.tipo}</Td>
              <Td>
                <p className="text-sm font-medium">{n.destinatarioNombre}</p>
                <p className="text-xs text-slate-500">{n.destinatarioEmail}</p>
              </Td>
              <Td>
                <p className="text-sm font-medium">{n.asunto}</p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{n.mensaje}</p>
                <p className="mt-1 text-xs text-slate-400">{n.referenciaModulo}</p>
              </Td>
              <Td>
                <StatusBadge label={n.estado} variant={estadoVariant(n.estado)} />
              </Td>
              <Td>{formatDate(n.fechaCreacion)}</Td>
              <Td>
                {n.fechaEnvioSimulado
                  ? formatDate(n.fechaEnvioSimulado.slice(0, 10))
                  : "—"}
              </Td>
              <Td className="text-right">
                {n.estado === "PENDIENTE" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pending}
                    onClick={() => simular(n.id)}
                  >
                    <Mail className="h-3.5 w-3.5" /> Simular envío
                  </Button>
                )}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}

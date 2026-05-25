"use client";

import {
  generarVistaPreviaReporteAction,
} from "@/app/(dashboard)/reportes/actions";
import { HistorialTimeline } from "@/components/shared/historial-timeline";
import { ReportesVaciosState } from "@/components/shared/arrendatario-sin-vinculos-state";
import { ReporteDownload } from "@/components/reportes/reporte-download";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { contratoOptionLabel, inmueblesById } from "@/lib/entity-labels";
import {
  REPORTE_CATALOGO,
  type FiltrosReporte,
  type ReporteDocumento,
  type TipoReporte,
} from "@/types/reportes";
import type { Contrato, Inmueble, Mantenimiento, NoRenovacion } from "@/types";
import {
  BarChart3,
  Building2,
  FileText,
  History,
  Wallet,
  Wrench,
} from "lucide-react";
import { useMemo, useState, useTransition, type ReactNode } from "react";

const ICONOS: Record<TipoReporte, ReactNode> = {
  HISTORIAL_CONTRATO: <History className="h-5 w-5" />,
  HISTORIAL_INMUEBLE: <Building2 className="h-5 w-5" />,
  ESTADO_CUENTA: <Wallet className="h-5 w-5" />,
  PAGOS_CANON: <BarChart3 className="h-5 w-5" />,
  SERVICIOS_PUBLICOS: <FileText className="h-5 w-5" />,
  MANTENIMIENTO: <Wrench className="h-5 w-5" />,
  NO_RENOVACION: <FileText className="h-5 w-5" />,
  TRAZABILIDAD_GLOBAL: <History className="h-5 w-5" />,
  CONTRATOS_VENCER: <Building2 className="h-5 w-5" />,
  CARTERA_BASICA: <Wallet className="h-5 w-5" />,
};

const FILTROS_INICIAL: FiltrosReporte = {
  tipoReporte: "HISTORIAL_CONTRATO",
  contratoId: "",
  inmuebleId: "",
  fechaDesde: "",
  fechaHasta: "",
  textoLibre: "",
};

export function ReportesModule({
  contratos,
  inmuebles,
  noRenovaciones,
  mantenimientos,
}: {
  contratos: Contrato[];
  inmuebles: Inmueble[];
  noRenovaciones: NoRenovacion[];
  mantenimientos: Mantenimiento[];
}) {
  const inmueblesMap = useMemo(() => inmueblesById(inmuebles), [inmuebles]);
  const [filtros, setFiltros] = useState<FiltrosReporte>({
    ...FILTROS_INICIAL,
    contratoId: contratos[0]?.id ?? "",
    inmuebleId: inmuebles[0]?.id ?? "",
  });
  const [reporte, setReporte] = useState<ReporteDocumento | null>(null);
  const [pending, startTransition] = useTransition();

  const catalogo = REPORTE_CATALOGO.find((c) => c.tipo === filtros.tipoReporte);

  function patch(partial: Partial<FiltrosReporte>) {
    setFiltros((f) => ({ ...f, ...partial }));
  }

  function limpiarFiltros() {
    setFiltros({
      ...FILTROS_INICIAL,
      tipoReporte: filtros.tipoReporte,
      contratoId: contratos[0]?.id ?? "",
      inmuebleId: inmuebles[0]?.id ?? "",
    });
    setReporte(null);
  }

  const sinDatos = contratos.length === 0 && inmuebles.length === 0;

  function vistaPrevia() {
    startTransition(async () => {
      const data = await generarVistaPreviaReporteAction(filtros);
      setReporte(data);
    });
  }

  return (
    <>
      <PageHeader
        pageTestId="page-reportes"
        title="Reportes"
        description="Evidencia documental y trazable — vista previa y descarga PDF"
      />

      {sinDatos ? (
        <ReportesVaciosState />
      ) : (
        <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {REPORTE_CATALOGO.map((item) => (
          <button
            key={item.tipo}
            type="button"
            onClick={() => patch({ tipoReporte: item.tipo })}
            className={`rounded-xl border p-4 text-left transition shadow-sm hover:border-indigo-300 ${
              filtros.tipoReporte === item.tipo
                ? "border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500"
                : "border-[var(--border)] bg-white"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="rounded-lg bg-indigo-100 p-2 text-indigo-700">
                {ICONOS[item.tipo]}
              </span>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">{item.titulo}</h3>
                <p className="text-xs text-slate-500 mt-1">{item.descripcion}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm mb-6">
        <h2 className="text-sm font-semibold text-slate-800 mb-4">Filtros del reporte</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {catalogo?.requiereContrato && (
            <FormField label="Contrato">
              <Select
                value={filtros.contratoId ?? ""}
                onChange={(e) => patch({ contratoId: e.target.value })}
              >
                {contratos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {contratoOptionLabel(c, inmueblesMap)}
                  </option>
                ))}
              </Select>
            </FormField>
          )}
          {(catalogo?.requiereInmueble || filtros.tipoReporte === "MANTENIMIENTO") && (
            <FormField label="Inmueble">
              <Select
                value={filtros.inmuebleId ?? ""}
                onChange={(e) => patch({ inmuebleId: e.target.value })}
              >
                {inmuebles.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.titulo}
                  </option>
                ))}
              </Select>
            </FormField>
          )}
          {filtros.tipoReporte === "NO_RENOVACION" && (
            <FormField label="Expediente no renovación">
              <Select
                value={filtros.noRenovacionId ?? ""}
                onChange={(e) => patch({ noRenovacionId: e.target.value })}
              >
                <option value="">Último del contrato</option>
                {noRenovaciones.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.code} — {n.estado}
                  </option>
                ))}
              </Select>
            </FormField>
          )}
          {filtros.tipoReporte === "MANTENIMIENTO" && (
            <FormField label="Ticket (opcional)">
              <Select
                value={filtros.mantenimientoId ?? ""}
                onChange={(e) => patch({ mantenimientoId: e.target.value })}
              >
                <option value="">Todos del inmueble</option>
                {mantenimientos
                  .filter((m) => !filtros.inmuebleId || m.inmuebleId === filtros.inmuebleId)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} — {m.titulo}
                    </option>
                  ))}
              </Select>
            </FormField>
          )}
          {(filtros.tipoReporte === "PAGOS_CANON" ||
            filtros.tipoReporte === "TRAZABILIDAD_GLOBAL") && (
            <FormField label="Estado pago">
              <Select
                value={filtros.estadoPago ?? ""}
                onChange={(e) => patch({ estadoPago: e.target.value || undefined })}
              >
                <option value="">Todos</option>
                <option value="REPORTADO">REPORTADO</option>
                <option value="VALIDADO">VALIDADO</option>
                <option value="RECHAZADO">RECHAZADO</option>
              </Select>
            </FormField>
          )}
          <FormField label="Fecha desde">
            <Input
              type="date"
              value={filtros.fechaDesde ?? ""}
              onChange={(e) => patch({ fechaDesde: e.target.value })}
            />
          </FormField>
          <FormField label="Fecha hasta">
            <Input
              type="date"
              value={filtros.fechaHasta ?? ""}
              onChange={(e) => patch({ fechaHasta: e.target.value })}
            />
          </FormField>
          <FormField label="Búsqueda libre">
            <Input
              value={filtros.textoLibre ?? ""}
              onChange={(e) => patch({ textoLibre: e.target.value })}
              placeholder="Descripción, usuario, entidad..."
            />
          </FormField>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={filtros.soloConAdjuntos ?? false}
              onChange={(e) => patch({ soloConAdjuntos: e.target.checked })}
            />
            Solo con adjuntos
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={filtros.soloCambiosEstado ?? false}
              onChange={(e) => patch({ soloCambiosEstado: e.target.checked })}
            />
            Solo cambios de estado
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={filtros.soloEventosEconomicos ?? false}
              onChange={(e) => patch({ soloEventosEconomicos: e.target.checked })}
            />
            Solo eventos económicos
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => vistaPrevia()} disabled={pending}>
            Vista previa
          </Button>
          <Button variant="secondary" onClick={() => limpiarFiltros()}>
            Limpiar filtros
          </Button>
          {reporte && <ReporteDownload reporte={reporte} size="md" />}
        </div>
      </div>

      {reporte && (
        <div className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{reporte.titulo}</h2>
          {reporte.subtitulo && (
            <p className="text-sm text-slate-500">{reporte.subtitulo}</p>
          )}
          {Object.keys(reporte.filtrosAplicados).length > 0 && (
            <p className="text-xs text-slate-500 mt-2">
              Filtros:{" "}
              {Object.entries(reporte.filtrosAplicados)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" · ")}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-4">
            {reporte.resumen.map((r) => (
              <div
                key={r.etiqueta}
                className="rounded-lg bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="text-slate-500">{r.etiqueta}: </span>
                <span className="font-medium">{r.valor}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-6">
            {reporte.secciones.map((s) => (
              <div key={s.id}>
                <h3 className="font-medium text-slate-800 mb-2">{s.titulo}</h3>
                {s.filas && (
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    {s.filas.map((f) => (
                      <div key={f.etiqueta}>
                        <dt className="text-slate-500">{f.etiqueta}</dt>
                        <dd>{f.valor}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {s.tabla && (
                  <div className="overflow-x-auto mt-2">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50">
                          {s.tabla.columnas.map((c) => (
                            <th key={c} className="border p-2 text-left">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {s.tabla.filas.map((fila, ri) => (
                          <tr key={ri}>
                            {fila.map((cell, ci) => (
                              <td key={ci} className="border p-2">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {s.texto && (
                  <pre className="text-xs mt-2 whitespace-pre-wrap bg-slate-50 p-2 rounded max-h-32 overflow-auto">
                    {s.texto}
                  </pre>
                )}
              </div>
            ))}
          </div>
          {reporte.eventosTrazabilidad.length > 0 && (
            <div className="mt-8">
              <h3 className="font-medium text-slate-800 mb-2">
                Línea de tiempo ({reporte.eventosTrazabilidad.length} eventos)
              </h3>
              <HistorialTimeline eventos={reporte.eventosTrazabilidad.slice(0, 50)} />
            </div>
          )}
        </div>
      )}
        </>
      )}
    </>
  );
}

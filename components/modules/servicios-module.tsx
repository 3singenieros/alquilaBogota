"use client";

import {
  listarHistorialServicioAction,
} from "@/app/(dashboard)/trazabilidad/actions";
import {
  rechazarPagoServicioAction,
  reportarPagoServicioAction,
  validarPagoServicioAction,
} from "@/app/(dashboard)/servicios/actions";
import { HistorialTimeline } from "@/components/trazabilidad/historial-timeline";
import { SimulatedFileInput } from "@/components/shared/simulated-file-input";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusBadge, estadoVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField, Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import {
  PERIODICIDAD_LABEL,
  TIPO_SERVICIO_LABEL,
} from "@/lib/servicios-labels";
import { puedeValidarORechazarPago } from "@/lib/servicios-estado";
import { formatCurrency, formatDate } from "@/lib/utils";
import type {
  Contrato,
  EstadoPagoServicioPublico,
  PagoServicioPublico,
  Rol,
  ServicioPublicoContrato,
} from "@/types";
import type { EventoTrazabilidad } from "@/types/trazabilidad";
import { Check, Eye, History, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

const ESTADOS_PAGO: EstadoPagoServicioPublico[] = [
  "PENDIENTE",
  "REPORTADO",
  "VALIDADO",
  "RECHAZADO",
  "VENCIDO",
];

type PagoConServicio = PagoServicioPublico & {
  servicio?: ServicioPublicoContrato;
};

export function ServiciosModule({
  serviciosContrato,
  pagos,
  contratos,
  rol,
}: {
  serviciosContrato: ServicioPublicoContrato[];
  pagos: PagoServicioPublico[];
  contratos: Contrato[];
  rol: Rol;
}) {
  const canReview = rol === "ARRENDADOR" || rol === "ADMIN";
  const canReport = rol === "ARRENDATARIO" || rol === "ADMIN";

  const serviciosMap = useMemo(
    () => new Map(serviciosContrato.map((s) => [s.id, s])),
    [serviciosContrato]
  );
  const contratosMap = useMemo(
    () => new Map(contratos.map((c) => [c.id, c])),
    [contratos]
  );

  const pagosEnriquecidos: PagoConServicio[] = useMemo(
    () =>
      pagos.map((p) => ({
        ...p,
        servicio: serviciosMap.get(p.servicioPublicoContratoId),
      })),
    [pagos, serviciosMap]
  );

  const serviciosActivos = useMemo(
    () => serviciosContrato.filter((s) => s.activo),
    [serviciosContrato]
  );

  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [validateOpen, setValidateOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [comprobanteOpen, setComprobanteOpen] = useState(false);
  const [historialOpen, setHistorialOpen] = useState(false);
  const [servicioTarget, setServicioTarget] = useState<ServicioPublicoContrato | null>(null);
  const [pagoTarget, setPagoTarget] = useState<PagoConServicio | null>(null);
  const [historialEventos, setHistorialEventos] = useState<EventoTrazabilidad[]>([]);
  const [observaciones, setObservaciones] = useState("");
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [pending, startTransition] = useTransition();
  const [pagosState, setPagosState] = useState(pagosEnriquecidos);

  useEffect(() => {
    setPagosState(pagosEnriquecidos);
  }, [pagosEnriquecidos]);

  const filteredPagos = useMemo(
    () =>
      pagosState.filter((p) => {
        const q = search.toLowerCase();
        const label = p.servicio
          ? `${TIPO_SERVICIO_LABEL[p.servicio.tipoServicio]} ${p.servicio.empresaPrestadora}`
          : "";
        const matchSearch =
          !search ||
          p.periodo.toLowerCase().includes(q) ||
          label.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q);
        const matchEstado = !estadoFilter || p.estado === estadoFilter;
        return matchSearch && matchEstado;
      }),
    [pagosState, search, estadoFilter]
  );

  const alertas = useMemo(
    () => ({
      reportados: pagosState.filter((p) => p.estado === "REPORTADO").length,
      vencidos: pagosState.filter((p) => p.estado === "VENCIDO").length,
    }),
    [pagosState]
  );

  function confirmarReporte(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!servicioTarget) return;
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const created = await reportarPagoServicioAction({
        servicioPublicoContratoId: servicioTarget.id,
        periodo: fd.get("periodo") as string,
        fechaPago: fd.get("fechaPago") as string,
        valorPagado: Number(fd.get("valorPagado")),
        comprobanteUrl: (fd.get("comprobanteUrl") as string) || undefined,
        fechaVencimiento: (fd.get("fechaVencimiento") as string) || undefined,
        observaciones: (fd.get("observaciones") as string) || undefined,
      });
      if (created) {
        setPagosState((prev) => [
          ...prev,
          { ...created, servicio: servicioTarget },
        ]);
      }
      setReportOpen(false);
      setServicioTarget(null);
    });
  }

  function confirmarValidacion() {
    if (!pagoTarget) return;
    startTransition(async () => {
      const updated = await validarPagoServicioAction(pagoTarget.id, observaciones);
      if (updated) {
        setPagosState((prev) =>
          prev.map((p) =>
            p.id === pagoTarget.id ? { ...p, ...updated, servicio: p.servicio } : p
          )
        );
      }
      setValidateOpen(false);
      setPagoTarget(null);
      setObservaciones("");
    });
  }

  function confirmarRechazo() {
    if (!pagoTarget || !motivoRechazo.trim()) return;
    startTransition(async () => {
      const updated = await rechazarPagoServicioAction(pagoTarget.id, motivoRechazo);
      if (updated) {
        setPagosState((prev) =>
          prev.map((p) =>
            p.id === pagoTarget.id ? { ...p, ...updated, servicio: p.servicio } : p
          )
        );
      }
      setRejectOpen(false);
      setPagoTarget(null);
      setMotivoRechazo("");
    });
  }

  async function verHistorialServicio(servicioId: string) {
    const eventos = await listarHistorialServicioAction(servicioId);
    setHistorialEventos(eventos);
    setHistorialOpen(true);
  }

  return (
    <>
      <PageHeader
        title="Servicios públicos"
        description="Pagos periódicos de servicios configurados en el contrato (distinto del canon de arrendamiento)"
        action={
          canReport ? undefined : (
            <Link href="/contratos" className="text-sm text-indigo-600 hover:underline">
              Configurar servicios en Contratos →
            </Link>
          )
        }
      />

      {canReport && (
        <p className="rounded-lg border border-indigo-100 bg-indigo-50/50 px-3 py-2 text-sm text-indigo-900">
          Los servicios de tu contrato los define el arrendador. Aquí solo{" "}
          <strong>reportas el pago</strong> de cada periodo (agua, energía, etc.).
        </p>
      )}

      {canReview && (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          Para agregar o editar servicios base (empresa, cuenta, periodicidad), use{" "}
          <Link href="/contratos" className="font-medium text-indigo-600">
            Contratos → Servicios del contrato
          </Link>
          .
        </p>
      )}

      {(alertas.reportados > 0 || alertas.vencidos > 0) && canReview && (
        <div className="flex flex-wrap gap-3 text-sm">
          {alertas.reportados > 0 && (
            <span className="rounded-lg bg-amber-50 px-3 py-1 text-amber-800">
              {alertas.reportados} pago(s) por validar
            </span>
          )}
          {alertas.vencidos > 0 && (
            <span className="rounded-lg bg-red-50 px-3 py-1 text-red-800">
              {alertas.vencidos} pago(s) vencidos
            </span>
          )}
        </div>
      )}

      {canReport && serviciosActivos.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-800">
            Servicios de mi contrato
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {serviciosActivos.map((s) => {
              const ctr = contratosMap.get(s.contratoId);
              return (
                <div
                  key={s.id}
                  className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm"
                >
                  <p className="font-medium text-slate-900">
                    {TIPO_SERVICIO_LABEL[s.tipoServicio]}
                  </p>
                  <p className="text-xs text-slate-500">
                    {s.empresaPrestadora} · {PERIODICIDAD_LABEL[s.periodicidad]}
                  </p>
                  <p className="mt-1 font-mono text-xs text-slate-600">
                    Cuenta {s.numeroCuentaServicio}
                  </p>
                  {ctr && (
                    <p className="mt-1 text-xs text-slate-400">Contrato {ctr.code}</p>
                  )}
                  <Button
                    className="mt-3 w-full"
                    size="sm"
                    onClick={() => {
                      setServicioTarget(s);
                      setReportOpen(true);
                    }}
                  >
                    Reportar pago del periodo
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">Pagos reportados</h2>
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          estado={estadoFilter}
          onEstadoChange={setEstadoFilter}
          estados={ESTADOS_PAGO.map((e) => ({ value: e, label: e }))}
          placeholder="Servicio, periodo o código..."
        />
        <Table>
          <thead>
            <tr>
              <Th>Código</Th>
              <Th>Servicio</Th>
              <Th>Contrato</Th>
              <Th>Periodo</Th>
              <Th>Valor</Th>
              <Th>Fecha pago</Th>
              <Th>Vencimiento</Th>
              <Th>Estado</Th>
              <Th>Comprobante</Th>
              <Th className="text-right">Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {filteredPagos.length === 0 ? (
              <tr>
                <Td colSpan={10} className="text-center text-sm text-slate-500">
                  No hay pagos de servicios registrados.
                </Td>
              </tr>
            ) : (
              filteredPagos.map((p) => (
                <Tr key={p.id}>
                  <Td className="font-mono text-xs">{p.code}</Td>
                  <Td>
                    {p.servicio ? (
                      <>
                        {TIPO_SERVICIO_LABEL[p.servicio.tipoServicio]}
                        <span className="block text-xs text-slate-500">
                          {p.servicio.empresaPrestadora}
                        </span>
                      </>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td className="font-mono text-xs">
                    {contratosMap.get(p.contratoId)?.code ?? p.contratoId}
                  </Td>
                  <Td>{p.periodo}</Td>
                  <Td>{formatCurrency(p.valorPagado)}</Td>
                  <Td>{formatDate(p.fechaPago)}</Td>
                  <Td>{formatDate(p.fechaVencimiento)}</Td>
                  <Td>
                    <StatusBadge label={p.estado} variant={estadoVariant(p.estado)} />
                    {p.estado === "RECHAZADO" && p.motivoRechazo && (
                      <p className="mt-1 text-xs text-red-600">{p.motivoRechazo}</p>
                    )}
                  </Td>
                  <Td>
                    {p.comprobanteUrl ? (
                      <button
                        type="button"
                        className="text-xs text-indigo-600"
                        onClick={() => {
                          setPagoTarget(p);
                          setComprobanteOpen(true);
                        }}
                      >
                        Ver
                      </button>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      {p.servicio && (
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Historial"
                          onClick={() => verHistorialServicio(p.servicioPublicoContratoId)}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      )}
                      {canReview && puedeValidarORechazarPago(p.estado) && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPagoTarget(p);
                              setValidateOpen(true);
                            }}
                          >
                            <Check className="h-4 w-4 text-emerald-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPagoTarget(p);
                              setRejectOpen(true);
                            }}
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </section>

      {canReport && serviciosActivos.length === 0 && (
        <p className="text-sm text-slate-500">
          No hay servicios activos en tus contratos confirmados. El arrendador debe configurarlos
          al crear el contrato.
        </p>
      )}

      <Modal
        open={reportOpen}
        onClose={() => {
          setReportOpen(false);
          setServicioTarget(null);
        }}
        title="Reportar pago de servicio"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setReportOpen(false);
                setServicioTarget(null);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" form="report-pago-srv" disabled={pending}>
              Enviar reporte
            </Button>
          </>
        }
      >
        {servicioTarget && (
          <form id="report-pago-srv" onSubmit={confirmarReporte} className="space-y-4">
            <p className="text-sm text-slate-600">
              {TIPO_SERVICIO_LABEL[servicioTarget.tipoServicio]} —{" "}
              {servicioTarget.empresaPrestadora} ({PERIODICIDAD_LABEL[servicioTarget.periodicidad]})
            </p>
            <FormField
              label={
                servicioTarget.periodicidad === "BIMESTRAL"
                  ? "Periodo (ej. 2026-05-2026-06)"
                  : "Periodo (ej. 2026-05)"
              }
            >
              <Input
                name="periodo"
                placeholder={
                  servicioTarget.periodicidad === "BIMESTRAL" ? "2026-05-2026-06" : "2026-05"
                }
                required
              />
            </FormField>
            <FormField label="Fecha de pago">
              <Input
                name="fechaPago"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                required
              />
            </FormField>
            <FormField label="Valor pagado">
              <Input name="valorPagado" type="number" required />
            </FormField>
            <FormField label="Fecha límite (vencimiento)">
              <Input name="fechaVencimiento" type="date" />
            </FormField>
            <FormField label="Comprobante">
              <SimulatedFileInput name="comprobanteUrl" label="Recibo o comprobante (simulado)" />
            </FormField>
            <FormField label="Observaciones">
              <Input name="observaciones" />
            </FormField>
          </form>
        )}
      </Modal>

      <Modal
        open={validateOpen}
        onClose={() => setValidateOpen(false)}
        title="Validar pago de servicio"
        footer={
          <>
            <Button variant="secondary" onClick={() => setValidateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarValidacion} disabled={pending}>
              Validar
            </Button>
          </>
        }
      >
        <FormField label="Observaciones (opcional)">
          <Input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
        </FormField>
      </Modal>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Rechazar pago"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              disabled={pending || !motivoRechazo.trim()}
              onClick={confirmarRechazo}
            >
              Rechazar
            </Button>
          </>
        }
      >
        <FormField label="Motivo obligatorio">
          <Input value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)} />
        </FormField>
      </Modal>

      <Modal
        open={comprobanteOpen}
        onClose={() => setComprobanteOpen(false)}
        title="Comprobante"
        footer={
          <Button variant="secondary" onClick={() => setComprobanteOpen(false)}>
            Cerrar
          </Button>
        }
      >
        <p className="font-mono text-sm">{pagoTarget?.comprobanteUrl}</p>
        <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
          <Eye className="h-3 w-3" /> Archivo simulado
        </p>
      </Modal>

      <Modal
        open={historialOpen}
        onClose={() => setHistorialOpen(false)}
        title="Historial del servicio"
        footer={
          <Button variant="secondary" onClick={() => setHistorialOpen(false)}>
            Cerrar
          </Button>
        }
      >
        <HistorialTimeline eventos={historialEventos} />
      </Modal>
    </>
  );
}

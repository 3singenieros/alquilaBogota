"use client";

import dynamic from "next/dynamic";
import { listarContratosFormAction } from "@/app/(dashboard)/contratos/actions";
import { listarInmueblesFormAction } from "@/app/(dashboard)/inmuebles/actions";
import {
  crearPagoAction,
  obtenerDatosPdfSoporteAction,
  rechazarPagoAction,
  validarPagoAction,
  vincularComprobantesPagoAction,
} from "@/app/(dashboard)/pagos/actions";
import { listarArchivosEntidadAction } from "@/app/actions/file-storage.actions";
import { VerAdjuntosButton } from "@/components/shared/adjuntos-panel";
import { AttachmentsList } from "@/components/shared/attachments-list";
import { MultiFileUploader } from "@/components/shared/multi-file-uploader";
import type { CargadoPorAdjunto } from "@/lib/archivos-adjuntos";
import { subirYVincularPostCreate, esAdjuntoPendienteSubida } from "@/lib/adjuntos-client";
import type { ArchivoAdjunto } from "@/types";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusBadge, estadoVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField, Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { contratoOptionLabel, inmueblesById } from "@/lib/entity-labels";
import { getModulePermissions } from "@/lib/auth/permissions";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Contrato, EstadoPago, Inmueble, PagoReportado, Rol } from "@/types";
import type { SoportePago, SoportePdfData } from "@/types/soporte-pago";
import { Check, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";

const SoportePagoDownload = dynamic(
  () =>
    import("@/components/pagos/soporte-pago-download").then((mod) => ({
      default: mod.SoportePagoDownload,
    })),
  {
    ssr: false,
    loading: () => (
      <Button variant="secondary" size="sm" disabled type="button">
        Cargando PDF...
      </Button>
    ),
  }
);

const ESTADOS: EstadoPago[] = ["REPORTADO", "VALIDADO", "RECHAZADO"];

function pagoTieneComprobantes(p: PagoReportado) {
  return (p.comprobantesAdjuntos?.length ?? 0) > 0;
}

export function PagosModule({
  initialData,
  contratos,
  inmuebles,
  soportes: initialSoportes,
  pdfPorPagoId: initialPdfMap,
  rol,
  usuarioId,
  usuarioNombre,
  usuarioEmail,
}: {
  initialData: PagoReportado[];
  contratos: Contrato[];
  inmuebles: Inmueble[];
  soportes: SoportePago[];
  pdfPorPagoId: Record<string, SoportePdfData>;
  rol: Rol;
  usuarioId: string;
  usuarioNombre: string;
  usuarioEmail: string;
}) {
  const cargadoPor: CargadoPorAdjunto = {
    id: usuarioId,
    nombre: usuarioNombre,
    email: usuarioEmail,
    rol,
  };
  const [comprobantes, setComprobantes] = useState<ArchivoAdjunto[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingComprobantes, setPendingComprobantes] = useState<File[]>([]);
  const perms = getModulePermissions(rol, "pagos");
  const canReview = rol === "ARRENDADOR" || rol === "ADMIN";
  const canReport = rol === "ARRENDATARIO" || rol === "ADMIN";

  const [contratosOptions, setContratosOptions] = useState(contratos);
  const [inmueblesOptions, setInmueblesOptions] = useState(inmuebles);
  const inmueblesMap = useMemo(() => inmueblesById(inmueblesOptions), [inmueblesOptions]);
  const [items, setItems] = useState(initialData);
  const [soportes, setSoportes] = useState(initialSoportes);
  const [pdfPorPagoId, setPdfPorPagoId] = useState(initialPdfMap);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [validateOpen, setValidateOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [target, setTarget] = useState<PagoReportado | null>(null);
  const [observaciones, setObservaciones] = useState("");
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [pending, startTransition] = useTransition();

  const soportesByPagoId = useMemo(
    () => new Map(soportes.map((s) => [s.pagoId, s])),
    [soportes]
  );

  useEffect(() => {
    setContratosOptions(contratos);
    setInmueblesOptions(inmuebles);
  }, [contratos, inmuebles]);

  async function openForm() {
    const [freshContratos, freshInmuebles] = await Promise.all([
      listarContratosFormAction(),
      listarInmueblesFormAction(),
    ]);
    setContratosOptions(freshContratos);
    setInmueblesOptions(freshInmuebles);
    setUploadError(null);
    setOpen(true);
  }

  const filtered = useMemo(
    () =>
      items.filter((p) => {
        const matchSearch = !search || p.contratoId.includes(search) || p.mes.includes(search);
        const matchEstado = !estadoFilter || p.estado === estadoFilter;
        return matchSearch && matchEstado;
      }),
    [items, search, estadoFilter]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      contratoId: fd.get("contratoId") as string,
      mes: fd.get("mes") as string,
      monto: Number(fd.get("monto")),
      fechaReporte: new Date().toISOString().slice(0, 10),
      estado: "REPORTADO" as EstadoPago,
      comprobantesAdjuntos: comprobantes,
      medioPago: (fd.get("medioPago") as string) || undefined,
      reportadoPorId: usuarioId,
      notas: (fd.get("notas") as string) || undefined,
    };
    startTransition(async () => {
      setUploadError(null);
      let uploadErr: string | null = null;
      let created = await crearPagoAction({
        ...payload,
        comprobantesAdjuntos: [],
      });
      const hayComprobantesPendientes =
        pendingComprobantes.length > 0 ||
        comprobantes.some(esAdjuntoPendienteSubida);
      if (created && pendingComprobantes.length > 0) {
        const contrato = contratosOptions.find((c) => c.id === payload.contratoId);
        try {
          const updated = await subirYVincularPostCreate(
            created.id,
            pendingComprobantes,
            {
              bucket: "pagos",
              entidadTipo: "PAGO",
              contratoId: payload.contratoId,
              inmuebleId: contrato?.inmuebleId,
            },
            vincularComprobantesPagoAction
          );
          if (updated && "code" in updated) created = updated;
        } catch (err) {
          uploadErr =
            err instanceof Error
              ? err.message
              : "No se pudieron subir los comprobantes a Storage.";
        }
      } else if (created && hayComprobantesPendientes) {
        uploadErr =
          "El pago se guardó pero los comprobantes no se subieron. Vuelve a intentarlo.";
      }
      if (uploadErr) setUploadError(uploadErr);
      if (created) setItems((prev) => [...prev, created]);
      setComprobantes([]);
      setPendingComprobantes([]);
      if (!uploadErr) setOpen(false);
    });
  }

  async function abrirValidacion(p: PagoReportado) {
    const docs = await listarArchivosEntidadAction("PAGO", p.id);
    setTarget({ ...p, comprobantesAdjuntos: docs.length ? docs : p.comprobantesAdjuntos });
    setObservaciones("");
    setValidateOpen(true);
  }

  async function abrirRechazo(p: PagoReportado) {
    const docs = await listarArchivosEntidadAction("PAGO", p.id);
    setTarget({ ...p, comprobantesAdjuntos: docs.length ? docs : p.comprobantesAdjuntos });
    setMotivoRechazo("");
    setRejectOpen(true);
  }
  function confirmarValidacion() {
    if (!target) return;
    startTransition(async () => {
      const result = await validarPagoAction(target.id, observaciones);
      if (result?.pago) {
        setItems((prev) =>
          prev.map((p) => (p.id === target.id ? { ...p, ...result.pago } : p))
        );
        if (result.soporte) {
          setSoportes((prev) => [...prev, result.soporte]);
          const pdf = await obtenerDatosPdfSoporteAction(result.soporte.id);
          if (pdf) {
            setPdfPorPagoId((prev) => ({ ...prev, [result.pago.id]: pdf }));
          }
        }
      }
      setValidateOpen(false);
      setTarget(null);
      setObservaciones("");
    });
  }

  function confirmarRechazo() {
    if (!target || !motivoRechazo.trim()) return;
    startTransition(async () => {
      const updated = await rechazarPagoAction(target.id, motivoRechazo);
      if (updated) {
        setItems((prev) =>
          prev.map((p) => (p.id === target.id ? { ...p, ...updated } : p))
        );
      }
      setRejectOpen(false);
      setTarget(null);
      setMotivoRechazo("");
    });
  }

  return (
    <>
      <PageHeader
        title="Pagos reportados"
        description="El arrendatario reporta pagos; el arrendador valida o rechaza y genera soporte PDF"
        action={
          canReport && perms.canCreate ? (
            <Button onClick={() => openForm()}>
              <Plus className="h-4 w-4" /> Reportar pago
            </Button>
          ) : undefined
        }
      />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        estado={estadoFilter}
        onEstadoChange={setEstadoFilter}
        estados={ESTADOS.map((e) => ({ value: e, label: e }))}
        placeholder="Contrato o mes..."
      />
      <Table>
        <thead>
          <tr>
            <Th>Código</Th>
            <Th>Contrato</Th>
            <Th>Periodo</Th>
            <Th>Monto</Th>
            <Th>Reporte</Th>
            <Th>Validación</Th>
            <Th>Estado</Th>
            <Th>Comprobante</Th>
            <Th className="text-right">Acciones</Th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <Td colSpan={9} className="text-center text-sm text-slate-500">
                No hay pagos que coincidan con el filtro.
              </Td>
            </tr>
          ) : (
            filtered.map((p) => {
              const contrato = contratosOptions.find((c) => c.id === p.contratoId);
              const soporte = soportesByPagoId.get(p.id);
              const pdfData = pdfPorPagoId[p.id];
              return (
                <Tr key={p.id}>
                  <Td className="font-mono text-xs text-slate-600">{p.code}</Td>
                  <Td>
                    {contrato
                      ? contratoOptionLabel(contrato, inmueblesMap)
                      : p.contratoId}
                  </Td>
                  <Td>{p.mes}</Td>
                  <Td>{formatCurrency(p.monto)}</Td>
                  <Td>{formatDate(p.fechaReporte)}</Td>
                  <Td className="text-xs">
                    {p.fechaValidacion ? formatDate(p.fechaValidacion) : "—"}
                    {soporte ? (
                      <p className="mt-0.5 text-indigo-600">{soporte.numeroSoporte}</p>
                    ) : null}
                    {p.estado === "RECHAZADO" && p.motivoRechazo ? (
                      <p className="mt-1 text-red-600" title={p.motivoRechazo}>
                        {p.motivoRechazo}
                      </p>
                    ) : null}
                  </Td>
                  <Td>
                    <StatusBadge label={p.estado} variant={estadoVariant(p.estado)} />
                  </Td>
                  <Td>
                    <VerAdjuntosButton
                      titulo={`Comprobantes — ${p.code}`}
                      entidadTipo="PAGO"
                      entidadId={p.id}
                      listas={[
                        {
                          etiqueta: "Comprobante de pago",
                          archivos: p.comprobantesAdjuntos,
                          entidadTipo: "PAGO",
                          entidadId: p.id,
                        },
                      ]}
                    />
                  </Td>
                  <Td className="text-right whitespace-nowrap">
                    {canReview && p.estado === "REPORTADO" ? (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={pending}
                          onClick={() => void abrirValidacion(p)}
                        >
                          <Check className="h-3.5 w-3.5" /> Validar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pending}
                          onClick={() => void abrirRechazo(p)}
                        >
                          <X className="h-3.5 w-3.5 text-red-500" /> Rechazar
                        </Button>
                      </>
                    ) : null}
                    {p.estado === "VALIDADO" && pdfData ? (
                      <div className="mt-1 inline-block">
                        <SoportePagoDownload data={pdfData} />
                      </div>
                    ) : null}
                  </Td>
                </Tr>
              );
            })
          )}
        </tbody>
      </Table>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Reportar pago"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="pago-form" disabled={pending}>
              Guardar
            </Button>
          </>
        }
      >
        <form id="pago-form" onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Contrato">
            <Select name="contratoId" defaultValue={contratosOptions[0]?.id} required>
              {contratosOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {contratoOptionLabel(c, inmueblesMap)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Mes (YYYY-MM)">
            <Input name="mes" defaultValue="2026-06" required />
          </FormField>
          <FormField label="Monto">
            <Input name="monto" type="number" required />
          </FormField>
          <FormField label="Medio de pago (opcional)">
            <Input name="medioPago" placeholder="Transferencia, PSE, efectivo..." />
          </FormField>
          <MultiFileUploader
            label="Comprobantes de pago"
            value={comprobantes}
            onChange={setComprobantes}
            cargadoPor={cargadoPor}
            onPendingFilesChange={setPendingComprobantes}
          />
          <FormField label="Notas">
            <Input name="notas" />
          </FormField>
          {uploadError ? (
            <p className="text-sm text-red-600">{uploadError}</p>
          ) : null}
        </form>
      </Modal>

      <Modal
        open={validateOpen}
        onClose={() => setValidateOpen(false)}
        title="Validar pago"
        footer={
          <>
            <Button variant="secondary" onClick={() => setValidateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarValidacion} disabled={pending}>
              Confirmar validación
            </Button>
          </>
        }
      >
        {target ? (
          <div className="space-y-4 text-sm">
            <p>
              <span className="text-slate-500">Código:</span> {target.code}
            </p>
            <p>
              <span className="text-slate-500">Periodo:</span> {target.mes}
            </p>
            <p>
              <span className="text-slate-500">Monto:</span> {formatCurrency(target.monto)}
            </p>
            <p>
              <span className="text-slate-500">Reportado:</span>{" "}
              {formatDate(target.fechaReporte)}
            </p>
            <FormField label="Observaciones (opcional)">
              <Input
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej. Pago recibido correctamente"
              />
            </FormField>
            {target && pagoTieneComprobantes(target) ? (
              <div>
                <p className="mb-2 text-xs font-medium text-slate-600">
                  Comprobantes reportados por el arrendatario
                </p>
                <AttachmentsList
                  archivos={target.comprobantesAdjuntos ?? []}
                  entidadTipo="PAGO"
                  entidadId={target.id}
                />
              </div>
            ) : (
              <p className="text-xs text-amber-700">
                Este pago no tiene comprobantes adjuntos.
              </p>
            )}
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">
              Al validar se generará un soporte PDF y una notificación simulada para el
              arrendatario.
            </p>
          </div>
        ) : null}
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
              onClick={confirmarRechazo}
              disabled={pending || !motivoRechazo.trim()}
            >
              Confirmar rechazo
            </Button>
          </>
        }
      >
        <FormField label="Motivo del rechazo (obligatorio)">
          <Input
            value={motivoRechazo}
            onChange={(e) => setMotivoRechazo(e.target.value)}
            placeholder="Indique por qué no se acepta el comprobante"
            required
          />
        </FormField>
        {target && pagoTieneComprobantes(target) ? (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-slate-600">Comprobantes adjuntos</p>
            <AttachmentsList
              archivos={target.comprobantesAdjuntos ?? []}
              entidadTipo="PAGO"
              entidadId={target.id}
            />
          </div>
        ) : null}
      </Modal>
    </>
  );
}

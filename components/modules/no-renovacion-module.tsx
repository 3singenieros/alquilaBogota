"use client";

import {
  actualizarDatosFormalesContratoAction,
  actualizarExpedienteNoRenovacionAction,
  sincronizarPartesExpedienteAction,
  crearExpedienteNoRenovacionAction,
  generarComunicacionNoRenovacionAction,
  obtenerContextoNoRenovacionAction,
  obtenerDatosPdfNoRenovacionAction,
  obtenerExpedienteNoRenovacionAction,
  registrarEnvioNoRenovacionAction,
} from "@/app/(dashboard)/no-renovacion/actions";
import { NoRenovacionDownload } from "@/components/no-renovacion/no-renovacion-download";
import { MultiFileUploader } from "@/components/shared/multi-file-uploader";
import type { CargadoPorAdjunto } from "@/lib/archivos-adjuntos";
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
import { formatDate } from "@/lib/utils";
import type {
  ArchivoAdjunto,
  Contrato,
  Inmueble,
  MedioEnvioNoRenovacion,
  NoRenovacion,
  Rol,
} from "@/types";
import type { NoRenovacionPdfData } from "@/types/no-renovacion-pdf";
import type { RolManifestante } from "@/lib/no-renovacion-build";
import { AlertTriangle, ChevronLeft, ChevronRight, FileText, Plus } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

const ALERTA_LEGAL =
  "Esta herramienta genera una comunicación formal de no renovación y permite conservar evidencia documental del envío. Para efectos probatorios, se recomienda realizar el envío por correo certificado o por el medio formal pactado en el contrato.";

const RECOMENDACION_ENVIO =
  "Se recomienda enviar esta comunicación por correo certificado o por el medio formal establecido en el contrato, conservando la evidencia de envío.";

const ESTADOS_FILTRO = [
  { value: "BORRADOR", label: "Borrador" },
  { value: "DOCUMENTO_GENERADO", label: "Documento generado" },
  { value: "ENVIO_REGISTRADO", label: "Envío registrado" },
  { value: "ANULADA", label: "Anulada" },
];

export function NoRenovacionModule({
  initialData,
  contratos,
  inmuebles,
  rol,
  usuarioId,
  usuarioNombre,
  usuarioEmail,
}: {
  initialData: NoRenovacion[];
  contratos: Contrato[];
  inmuebles: Inmueble[];
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
  const perms = getModulePermissions(rol, "no-renovacion");
  const inmueblesMap = useMemo(() => inmueblesById(inmuebles), [inmuebles]);
  const [items, setItems] = useState(initialData);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [pending, startTransition] = useTransition();

  const [contratoId, setContratoId] = useState(contratos[0]?.id ?? "");
  const [manifestanteAdmin, setManifestanteAdmin] = useState<RolManifestante>("ARRENDADOR");
  const [contexto, setContexto] = useState<Awaited<
    ReturnType<typeof obtenerContextoNoRenovacionAction>
  > | null>(null);
  const [expediente, setExpediente] = useState<NoRenovacion | null>(null);
  const [pdfData, setPdfData] = useState<NoRenovacionPdfData | null>(null);
  const [evidencias, setEvidencias] = useState<ArchivoAdjunto[]>([]);

  const [formPartes, setFormPartes] = useState({
    nombreArrendador: "",
    tipoDocumentoArrendador: "CC",
    numeroDocumentoArrendador: "",
    correoNotificacionesArrendador: "",
    direccionNotificacionesArrendador: "",
    nombreArrendatario: "",
    tipoDocumentoArrendatario: "CC",
    numeroDocumentoArrendatario: "",
    correoNotificacionesArrendatario: "",
    direccionNotificacionesArrendatario: "",
  });

  const [motivo, setMotivo] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [medioEnvio, setMedioEnvio] = useState<MedioEnvioNoRenovacion>("CORREO_CERTIFICADO");
  const [empresaMensajeria, setEmpresaMensajeria] = useState("");
  const [numeroGuia, setNumeroGuia] = useState("");
  const [fechaEnvio, setFechaEnvio] = useState(new Date().toISOString().slice(0, 10));

  const filtered = useMemo(
    () =>
      items.filter((n) => {
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          n.code.toLowerCase().includes(q) ||
          n.remitenteNombre.toLowerCase().includes(q) ||
          n.destinatarioNombre.toLowerCase().includes(q);
        const matchEstado = !estadoFilter || n.estado === estadoFilter;
        return matchSearch && matchEstado;
      }),
    [items, search, estadoFilter]
  );

  function resetWizard() {
    setStep(1);
    setExpediente(null);
    setContexto(null);
    setPdfData(null);
    setEvidencias([]);
    setMotivo("");
    setObservaciones("");
    setContratoId(contratos[0]?.id ?? "");
  }

  async function abrirNuevo() {
    resetWizard();
    setWizardOpen(true);
    if (contratoId) {
      const ctx = await obtenerContextoNoRenovacionAction(contratoId);
      setContexto(ctx);
      syncFormPartes(ctx);
    }
  }

  async function abrirExpediente(id: string) {
    resetWizard();
    const { expediente: exp, ...ctx } = await obtenerExpedienteNoRenovacionAction(id);
    setExpediente(exp);
    setContexto(ctx);
    setContratoId(exp.contratoId);
    setMotivo(exp.motivo ?? "");
    setObservaciones(exp.observaciones ?? "");
    syncFormPartes(ctx);
    setEvidencias(exp.evidenciaEnvioAdjuntos ?? []);
    if (exp.medioEnvio) setMedioEnvio(exp.medioEnvio);
    if (exp.empresaMensajeria) setEmpresaMensajeria(exp.empresaMensajeria);
    if (exp.numeroGuiaCorreoCertificado) setNumeroGuia(exp.numeroGuiaCorreoCertificado);
    if (exp.fechaEnvioRegistrado) setFechaEnvio(exp.fechaEnvioRegistrado.slice(0, 10));

    if (exp.estado === "ENVIO_REGISTRADO") setStep(5);
    else if (exp.cuerpoComunicacionGenerado) {
      setStep(4);
      const pdf = await obtenerDatosPdfNoRenovacionAction(id);
      setPdfData(pdf);
    } else if (exp.estado === "BORRADOR") setStep(2);
    else setStep(3);

    setWizardOpen(true);
  }

  function syncFormPartes(ctx: Awaited<ReturnType<typeof obtenerContextoNoRenovacionAction>>) {
    const c = ctx.contrato;
    const d = ctx.datosFormales;
    setFormPartes({
      nombreArrendador: c.nombreArrendador ?? d.arrendador.nombre,
      tipoDocumentoArrendador: c.tipoDocumentoArrendador ?? d.arrendador.tipoDocumento,
      numeroDocumentoArrendador: c.numeroDocumentoArrendador ?? d.arrendador.numeroDocumento,
      correoNotificacionesArrendador:
        c.correoNotificacionesArrendador ?? d.arrendador.correoNotificaciones,
      direccionNotificacionesArrendador:
        c.direccionNotificacionesArrendador ?? d.arrendador.direccionNotificaciones,
      nombreArrendatario: c.nombreArrendatario ?? d.arrendatario.nombre,
      tipoDocumentoArrendatario: c.tipoDocumentoArrendatario ?? d.arrendatario.tipoDocumento,
      numeroDocumentoArrendatario:
        c.numeroDocumentoArrendatario ?? d.arrendatario.numeroDocumento,
      correoNotificacionesArrendatario:
        c.correoNotificacionesArrendatario ?? d.arrendatario.correoNotificaciones,
      direccionNotificacionesArrendatario:
        c.direccionNotificacionesArrendatario ?? d.arrendatario.direccionNotificaciones,
    });
  }

  async function cargarContexto(id: string) {
    const ctx = await obtenerContextoNoRenovacionAction(id);
    setContexto(ctx);
    syncFormPartes(ctx);
  }

  async function paso1Continuar() {
    startTransition(async () => {
      await cargarContexto(contratoId);
      if (!expediente) {
        const manifestante = rol === "ADMIN" ? manifestanteAdmin : undefined;
        const created = await crearExpedienteNoRenovacionAction(contratoId, manifestante);
        setExpediente(created);
        setItems((prev) => [...prev, created]);
      }
      setStep(2);
    });
  }

  async function paso2Guardar() {
    if (!expediente || !contexto) return;
    startTransition(async () => {
      await actualizarDatosFormalesContratoAction(contratoId, formPartes);
      const refreshed = await obtenerContextoNoRenovacionAction(contratoId);
      setContexto(refreshed);
      const synced = await sincronizarPartesExpedienteAction(expediente.id);
      const updated = await actualizarExpedienteNoRenovacionAction(expediente.id, {
        motivo: motivo || undefined,
        observaciones: observaciones || undefined,
      });
      const final = updated ?? synced;
      if (final) {
        setExpediente(final);
        setItems((prev) => prev.map((n) => (n.id === final.id ? final : n)));
      }
      setStep(3);
    });
  }

  async function paso3Generar() {
    if (!expediente) return;
    startTransition(async () => {
      await actualizarExpedienteNoRenovacionAction(expediente.id, {
        motivo: motivo || undefined,
        observaciones: observaciones || undefined,
      });
      const updated = await generarComunicacionNoRenovacionAction(expediente.id);
      if (updated) {
        setExpediente(updated);
        setItems((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
        const pdf = await obtenerDatosPdfNoRenovacionAction(updated.id);
        setPdfData(pdf);
        setStep(4);
      }
    });
  }

  async function paso5Registrar() {
    if (!expediente) return;
    startTransition(async () => {
      const updated = await registrarEnvioNoRenovacionAction(expediente.id, {
        medioEnvio,
        empresaMensajeria: empresaMensajeria || undefined,
        numeroGuiaCorreoCertificado: numeroGuia || undefined,
        fechaEnvioRegistrado: fechaEnvio,
        evidenciaEnvioAdjuntos: evidencias,
      });
      if (updated) {
        setExpediente(updated);
        setItems((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
        setWizardOpen(false);
      }
    });
  }

  const faltantes = contexto?.datosFormales.faltantes ?? [];
  const soloLectura = Boolean(
    expediente &&
      (expediente.estado === "ENVIO_REGISTRADO" ||
        expediente.estado === "ANULADA" ||
        (expediente.iniciadoPorId !== usuarioId && rol !== "ADMIN"))
  );

  return (
    <>
      <PageHeader
        title="No renovación"
        description="Comunicación formal unilateral con expediente documental y evidencia de envío"
        action={
          perms.canCreate ? (
            <Button onClick={() => abrirNuevo()}>
              <Plus className="h-4 w-4" /> Nueva comunicación
            </Button>
          ) : undefined
        }
      />

      <div
        role="alert"
        className="mb-6 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900"
      >
        {ALERTA_LEGAL}
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        estado={estadoFilter}
        onEstadoChange={setEstadoFilter}
        estados={ESTADOS_FILTRO}
      />

      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr>
              <Th>Código</Th>
              <Th>Contrato</Th>
              <Th>Iniciado por</Th>
              <Th>Destinatario</Th>
              <Th>Preaviso</Th>
              <Th>Estado</Th>
              <Th>Envío</Th>
              <Th className="text-right">Acción</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((n) => {
              const contrato = contratos.find((c) => c.id === n.contratoId);
              return (
                <Tr key={n.id}>
                  <Td className="font-mono text-xs text-slate-600">{n.code}</Td>
                  <Td>
                    {contrato
                      ? contratoOptionLabel(contrato, inmueblesMap)
                      : n.contratoId}
                  </Td>
                  <Td className="text-xs">
                    {n.iniciadoPorNombre}
                    <span className="block text-slate-500">{n.iniciadoPorRol}</span>
                  </Td>
                  <Td className="text-xs">{n.destinatarioNombre}</Td>
                  <Td>
                    <StatusBadge
                      label={n.dentroDelPlazoPreaviso ? "En plazo" : "Fuera de plazo"}
                      variant={n.dentroDelPlazoPreaviso ? "success" : "warning"}
                    />
                  </Td>
                  <Td>
                    <StatusBadge label={n.estado} variant={estadoVariant(n.estado)} />
                  </Td>
                  <Td>
                    <StatusBadge
                      label={n.estadoEnvio}
                      variant={estadoVariant(n.estadoEnvio)}
                    />
                  </Td>
                  <Td className="text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => abrirExpediente(n.id)}
                    >
                      <FileText className="h-3.5 w-3.5" /> Ver expediente
                    </Button>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </div>

      <Modal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        title={`Expediente de no renovación — Paso ${step} de 5`}
        footer={
          <div className="flex w-full items-center justify-between">
            <Button
              variant="secondary"
              disabled={step <= 1 || pending}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setWizardOpen(false)}>
                Cerrar
              </Button>
              {step === 1 && (
                <Button disabled={pending || !contratoId} onClick={() => paso1Continuar()}>
                  Continuar <ChevronRight className="h-4 w-4" />
                </Button>
              )}
              {step === 2 && !soloLectura && (
                <Button disabled={pending} onClick={() => paso2Guardar()}>
                  Guardar y continuar <ChevronRight className="h-4 w-4" />
                </Button>
              )}
              {step === 3 && !soloLectura && (
                <Button disabled={pending} onClick={() => paso3Generar()}>
                  Generar comunicación
                </Button>
              )}
              {step === 4 && !soloLectura && (
                <Button disabled={pending} onClick={() => setStep(5)}>
                  Registrar envío <ChevronRight className="h-4 w-4" />
                </Button>
              )}
              {step === 5 && !soloLectura && expediente?.estado !== "ENVIO_REGISTRADO" && (
                <Button disabled={pending} onClick={() => paso5Registrar()}>
                  Registrar evidencia de envío
                </Button>
              )}
            </div>
          </div>
        }
      >
        {faltantes.length > 0 && step >= 2 && (
          <div className="mb-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <strong>Faltan datos para generar una comunicación formal completa.</strong>
              <ul className="mt-1 list-disc pl-4 text-xs">
                {faltantes.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {step === 1 && contexto && (
          <div className="space-y-4">
            <FormField label="Contrato">
              <Select
                value={contratoId}
                onChange={(e) => {
                  setContratoId(e.target.value);
                  cargarContexto(e.target.value);
                }}
                disabled={!!expediente}
              >
                {contratos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {contratoOptionLabel(c, inmueblesMap)}
                  </option>
                ))}
              </Select>
            </FormField>
            {rol === "ADMIN" && !expediente && (
              <FormField label="Parte que manifiesta no renovar">
                <Select
                  value={manifestanteAdmin}
                  onChange={(e) =>
                    setManifestanteAdmin(e.target.value as RolManifestante)
                  }
                >
                  <option value="ARRENDADOR">Arrendador</option>
                  <option value="ARRENDATARIO">Arrendatario</option>
                </Select>
              </FormField>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500">Inmueble</span>
                <p>{contexto.inmueble.titulo}</p>
              </div>
              <div>
                <span className="text-slate-500">Fin de contrato</span>
                <p>{formatDate(contexto.contrato.fechaFin)}</p>
              </div>
              <div>
                <span className="text-slate-500">Límite preaviso</span>
                <p>{formatDate(contexto.contrato.fechaLimitePreaviso)}</p>
              </div>
              <div>
                <span className="text-slate-500">Prórroga automática</span>
                <p>{contexto.contrato.prorrogaAutomatica ? "Sí" : "No"}</p>
              </div>
              <div>
                <span className="text-slate-500">Plazo de preaviso</span>
                <StatusBadge
                  label={
                    contexto.dentroDelPlazoPreaviso ? "Dentro del plazo" : "Fuera del plazo"
                  }
                  variant={contexto.dentroDelPlazoPreaviso ? "success" : "warning"}
                />
              </div>
              <div>
                <span className="text-slate-500">Canon actual</span>
                <p>
                  {contexto.contrato.canonActual.toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <p className="text-sm font-medium text-slate-700">Arrendador (remitente o destinatario)</p>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Nombre">
                <Input
                  value={formPartes.nombreArrendador}
                  disabled={soloLectura}
                  onChange={(e) =>
                    setFormPartes((p) => ({ ...p, nombreArrendador: e.target.value }))
                  }
                />
              </FormField>
              <FormField label="Tipo documento">
                <Input
                  value={formPartes.tipoDocumentoArrendador}
                  disabled={soloLectura}
                  onChange={(e) =>
                    setFormPartes((p) => ({ ...p, tipoDocumentoArrendador: e.target.value }))
                  }
                />
              </FormField>
              <FormField label="Número documento">
                <Input
                  value={formPartes.numeroDocumentoArrendador}
                  disabled={soloLectura}
                  onChange={(e) =>
                    setFormPartes((p) => ({ ...p, numeroDocumentoArrendador: e.target.value }))
                  }
                />
              </FormField>
              <FormField label="Correo notificaciones">
                <Input
                  type="email"
                  value={formPartes.correoNotificacionesArrendador}
                  disabled={soloLectura}
                  onChange={(e) =>
                    setFormPartes((p) => ({
                      ...p,
                      correoNotificacionesArrendador: e.target.value,
                    }))
                  }
                />
              </FormField>
              <FormField label="Dirección notificación" className="col-span-2">
                <Input
                  value={formPartes.direccionNotificacionesArrendador}
                  disabled={soloLectura}
                  onChange={(e) =>
                    setFormPartes((p) => ({
                      ...p,
                      direccionNotificacionesArrendador: e.target.value,
                    }))
                  }
                />
              </FormField>
            </div>
            <p className="text-sm font-medium text-slate-700 pt-2">Arrendatario</p>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Nombre">
                <Input
                  value={formPartes.nombreArrendatario}
                  disabled={soloLectura}
                  onChange={(e) =>
                    setFormPartes((p) => ({ ...p, nombreArrendatario: e.target.value }))
                  }
                />
              </FormField>
              <FormField label="Tipo documento">
                <Input
                  value={formPartes.tipoDocumentoArrendatario}
                  disabled={soloLectura}
                  onChange={(e) =>
                    setFormPartes((p) => ({ ...p, tipoDocumentoArrendatario: e.target.value }))
                  }
                />
              </FormField>
              <FormField label="Número documento">
                <Input
                  value={formPartes.numeroDocumentoArrendatario}
                  disabled={soloLectura}
                  onChange={(e) =>
                    setFormPartes((p) => ({ ...p, numeroDocumentoArrendatario: e.target.value }))
                  }
                />
              </FormField>
              <FormField label="Correo notificaciones">
                <Input
                  type="email"
                  value={formPartes.correoNotificacionesArrendatario}
                  disabled={soloLectura}
                  onChange={(e) =>
                    setFormPartes((p) => ({
                      ...p,
                      correoNotificacionesArrendatario: e.target.value,
                    }))
                  }
                />
              </FormField>
              <FormField label="Dirección notificación" className="col-span-2">
                <Input
                  value={formPartes.direccionNotificacionesArrendatario}
                  disabled={soloLectura}
                  onChange={(e) =>
                    setFormPartes((p) => ({
                      ...p,
                      direccionNotificacionesArrendatario: e.target.value,
                    }))
                  }
                />
              </FormField>
            </div>
            {expediente && (
              <div className="grid grid-cols-2 gap-3 border-t pt-3 text-sm">
                <div>
                  <span className="text-slate-500">Remitente</span>
                  <p>{expediente.remitenteNombre}</p>
                </div>
                <div>
                  <span className="text-slate-500">Destinatario</span>
                  <p>{expediente.destinatarioNombre}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <FormField label="Motivo (opcional)">
              <Input
                value={motivo}
                disabled={soloLectura}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </FormField>
            <FormField label="Observaciones (opcional)">
              <Input
                value={observaciones}
                disabled={soloLectura}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </FormField>
            {expediente?.cuerpoComunicacionGenerado && (
              <FormField label="Comunicación generada">
                <pre className="max-h-48 overflow-auto rounded border bg-slate-50 p-3 text-xs whitespace-pre-wrap">
                  {expediente.cuerpoComunicacionGenerado}
                </pre>
              </FormField>
            )}
          </div>
        )}

        {step === 4 && pdfData && expediente && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Descargue la carta en PDF para su envío formal fuera del sistema.
            </p>
            <NoRenovacionDownload expedienteId={expediente.id} data={pdfData} size="md" />
            {expediente.estado === "ENVIO_REGISTRADO" && (
              <p className="text-sm text-emerald-700">
                Contrato marcado para no renovación al finalizar su vigencia.
              </p>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
              {RECOMENDACION_ENVIO}
            </div>
            <h3 className="font-medium text-slate-800">Registrar evidencia de envío</h3>
            <FormField label="Medio de envío">
              <Select
                value={medioEnvio}
                disabled={soloLectura}
                onChange={(e) => setMedioEnvio(e.target.value as MedioEnvioNoRenovacion)}
              >
                <option value="CORREO_CERTIFICADO">Correo certificado</option>
                <option value="EMAIL">Correo electrónico</option>
                <option value="FISICO">Entrega física</option>
                <option value="OTRO">Otro</option>
              </Select>
            </FormField>
            <FormField label="Empresa de mensajería">
              <Input
                value={empresaMensajeria}
                disabled={soloLectura}
                placeholder="Ej. Servientrega, 4-72"
                onChange={(e) => setEmpresaMensajeria(e.target.value)}
              />
            </FormField>
            <FormField label="Número de guía">
              <Input
                value={numeroGuia}
                disabled={soloLectura}
                onChange={(e) => setNumeroGuia(e.target.value)}
              />
            </FormField>
            <FormField label="Fecha de envío">
              <Input
                type="date"
                value={fechaEnvio}
                disabled={soloLectura}
                onChange={(e) => setFechaEnvio(e.target.value)}
              />
            </FormField>
            <MultiFileUploader
              label="Evidencias de envío"
              value={evidencias}
              onChange={setEvidencias}
              cargadoPor={cargadoPor}
              disabled={!!soloLectura}
            />
            {expediente?.estado === "ENVIO_REGISTRADO" && (
              <p className="text-sm text-emerald-700">
                Envío registrado el {formatDate(expediente.fechaEnvioRegistrado?.slice(0, 10) ?? "")}.
                Contrato marcado para no renovación al finalizar su vigencia.
              </p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

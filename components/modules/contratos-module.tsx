"use client";

import {
  actualizarContratoAction,
  aplicarReajusteCanonAction,
  crearContratoAction,
  eliminarContratoAction,
  listarInmueblesParaContratoFormAction,
} from "@/app/(dashboard)/contratos/actions";
import { listarHistorialContratoAction } from "@/app/(dashboard)/trazabilidad/actions";
import { listarArchivosEntidadAction } from "@/app/actions/file-storage.actions";
import { HistorialTimeline } from "@/components/trazabilidad/historial-timeline";
import { FormSection } from "@/components/shared/form-section";
import { VerAdjuntosButton } from "@/components/shared/adjuntos-panel";
import { AttachmentsList } from "@/components/shared/attachments-list";
import { MultiFileUploader } from "@/components/shared/multi-file-uploader";
import type { CargadoPorAdjunto } from "@/lib/archivos-adjuntos";
import { subirAdjuntosTrasCrear } from "@/lib/adjuntos-client";
import type { ArchivoAdjunto } from "@/types";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusBadge, estadoVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField, Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { parseContratoFormData } from "@/lib/contrato-form";
import {
  inmuebleOptionLabel,
  inmueblesById,
  inmuebleDisplayFromId,
  usuarioDisplayFromId,
  usuariosById,
} from "@/lib/entity-labels";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getModulePermissions } from "@/lib/auth/permissions";
import type {
  Contrato,
  EstadoContrato,
  EstadoDepositoGarantia,
  Inmueble,
  Rol,
  Usuario,
} from "@/types";
import type { EventoTrazabilidad } from "@/types/trazabilidad";
import { ContratoServiciosModal } from "@/components/contratos/contrato-servicios-modal";
import { History, Percent, Pencil, Plus, Trash2, Zap } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";

const ESTADOS: EstadoContrato[] = [
  "BORRADOR",
  "PENDIENTE_CONFIRMACION",
  "CONFIRMADO",
  "RECHAZADO",
  "CANCELADO",
  "TERMINADO",
  "VENCIDO",
];
const DEPOSITO_ESTADOS: EstadoDepositoGarantia[] = ["PENDIENTE", "DEVUELTO", "APLICADO"];

export function ContratosModule({
  initialData,
  inmuebles,
  arrendatarios = [],
  rol,
  usuarioId,
  usuarioNombre,
  usuarioEmail,
}: {
  initialData: Contrato[];
  inmuebles: Inmueble[];
  arrendatarios?: Usuario[];
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
  const [documentosContrato, setDocumentosContrato] = useState<ArchivoAdjunto[]>([]);
  const [pendingDocFiles, setPendingDocFiles] = useState<File[]>([]);
  const perms = getModulePermissions(rol, "contratos");
  const [inmueblesOptions, setInmueblesOptions] = useState(inmuebles);
  const inmueblesMap = useMemo(() => inmueblesById(inmueblesOptions), [inmueblesOptions]);
  const usuariosMap = useMemo(
    () => usuariosById(arrendatarios),
    [arrendatarios]
  );
  const [items, setItems] = useState(initialData);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [openReajuste, setOpenReajuste] = useState(false);
  const [reajusteTarget, setReajusteTarget] = useState<Contrato | null>(null);
  const [porcentajeReajuste, setPorcentajeReajuste] = useState("5");
  const [editing, setEditing] = useState<Contrato | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [historialOpen, setHistorialOpen] = useState(false);
  const [historialEventos, setHistorialEventos] = useState<EventoTrazabilidad[]>([]);
  const [historialTitulo, setHistorialTitulo] = useState("");
  const [serviciosOpen, setServiciosOpen] = useState(false);
  const [serviciosContrato, setServiciosContrato] = useState<Contrato | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setInmueblesOptions(inmuebles);
  }, [inmuebles]);

  async function openForm(editingItem: Contrato | null) {
    const fresh = await listarInmueblesParaContratoFormAction(editingItem?.id);
    setInmueblesOptions(fresh);
    setFormError(null);
    setEditing(editingItem);
    if (editingItem) {
      const docs = await listarArchivosEntidadAction("CONTRATO", editingItem.id);
      setDocumentosContrato(docs);
    } else {
      setDocumentosContrato([]);
    }
    setPendingDocFiles([]);
    setOpen(true);
  }

  function handleDocumentosChange(docs: ArchivoAdjunto[]) {
    setDocumentosContrato(docs);
    if (editing) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editing.id ? { ...i, documentosAdjuntos: docs } : i
        )
      );
    }
  }

  const filtered = useMemo(
    () =>
      items.filter((c) => {
        const q = search.toLowerCase();
        const matchSearch =
          !search ||
          c.code.toLowerCase().includes(q) ||
          c.inmuebleId.toLowerCase().includes(q);
        const matchEstado = !estadoFilter || c.estado === estadoFilter;
        return matchSearch && matchEstado;
      }),
    [items, search, estadoFilter]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      ...parseContratoFormData(fd),
      arrendadorId: usuarioId,
      documentosAdjuntos: documentosContrato,
    };
    startTransition(async () => {
      setFormError(null);
      if (editing) {
        const result = await actualizarContratoAction(editing.id, payload);
        if (!result.ok) {
          setFormError(result.error);
          return;
        }
        if (result.data) {
          setItems((prev) =>
            prev.map((i) => (i.id === editing.id ? { ...i, ...result.data! } : i))
          );
        }
      } else {
        if (inmueblesOptions.length === 0) {
          setFormError("No hay inmuebles disponibles sin contrato activo.");
          return;
        }
        const result = await crearContratoAction({
          ...payload,
          documentosAdjuntos: [],
        });
        if (!result.ok) {
          setFormError(result.error);
          return;
        }
        if (result.data && pendingDocFiles.length > 0) {
          const docs = await subirAdjuntosTrasCrear([], pendingDocFiles, {
            bucket: "contratos",
            entidadTipo: "CONTRATO",
            entidadId: result.data.id,
            contratoId: result.data.id,
            inmuebleId: result.data.inmuebleId,
            linkContratoId: result.data.id,
          });
          const upd = await actualizarContratoAction(result.data.id, {
            documentosAdjuntos: docs,
          });
          if (upd.ok && upd.data) {
            setItems((prev) => [...prev, upd.data!]);
          } else {
            setItems((prev) => [...prev, result.data!]);
          }
        } else if (result.data) {
          setItems((prev) => [...prev, result.data!]);
        }
      }
      setOpen(false);
      setEditing(null);
    });
  }

  function handleReajuste() {
    if (!reajusteTarget) return;
    const pct = Number(porcentajeReajuste);
    startTransition(async () => {
      const result = await aplicarReajusteCanonAction(reajusteTarget.id, pct);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      if (result.data) {
        setItems((prev) =>
          prev.map((c) => (c.id === reajusteTarget.id ? { ...c, ...result.data! } : c))
        );
      }
      setOpenReajuste(false);
      setReajusteTarget(null);
    });
  }

  return (
    <>
      <PageHeader
        title="Contratos"
        description="Trazabilidad contractual — codeudor, depósito, preaviso y reajuste de canon"
        action={
          perms.canCreate ? (
            <Button onClick={() => openForm(null)}>
              <Plus className="h-4 w-4" /> Nuevo contrato
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
        placeholder="Código o inmueble..."
      />
      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr>
              <Th>Código</Th>
              <Th>Inmueble</Th>
              <Th>Arrendatario</Th>
              <Th>Canon actual</Th>
              <Th>Inicio</Th>
              <Th>Fin</Th>
              <Th>Estado</Th>
              <Th>Prórroga</Th>
              <Th>Preaviso</Th>
              <Th>Codeudor</Th>
              <Th>Depósito</Th>
              <Th>Docs</Th>
              <Th className="text-right">Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <Tr key={c.id}>
                <Td className="font-mono text-xs text-slate-600">{c.code}</Td>
                <Td>{inmuebleDisplayFromId(c.inmuebleId, inmueblesMap)}</Td>
                <Td className="max-w-[140px] text-xs">
                  {usuarioDisplayFromId(c.arrendatarioId, usuariosMap)}
                </Td>
                <Td>{formatCurrency(c.canonActual)}</Td>
                <Td>{formatDate(c.fechaInicio)}</Td>
                <Td>{formatDate(c.fechaFin)}</Td>
                <Td>
                  <StatusBadge label={c.estado} variant={estadoVariant(c.estado)} />
                </Td>
                <Td>{c.prorrogaAutomatica ? "Sí" : "No"}</Td>
                <Td>{formatDate(c.fechaLimitePreaviso)}</Td>
                <Td className="text-xs">{c.codeudorNombre ?? "—"}</Td>
                <Td>
                  <StatusBadge
                    label={c.depositoGarantiaEstado}
                    variant={estadoVariant(c.depositoGarantiaEstado)}
                  />
                </Td>
                <Td>
                  <VerAdjuntosButton
                    titulo={`Documentos — ${c.code}`}
                    entidadTipo="CONTRATO"
                    entidadId={c.id}
                    canDelete={perms.canEdit}
                    listas={[
                      {
                        etiqueta: "Contrato",
                        archivos: c.documentosAdjuntos,
                        entidadTipo: "CONTRATO",
                        entidadId: c.id,
                      },
                    ]}
                  />
                </Td>
                <Td className="text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Ver historial"
                      onClick={() => {
                        startTransition(async () => {
                          const eventos = await listarHistorialContratoAction(c.id);
                          setHistorialEventos(eventos);
                          setHistorialTitulo(`Contrato ${c.code}`);
                          setHistorialOpen(true);
                        });
                      }}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    {(perms.canEdit || rol === "ADMIN") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Servicios públicos del contrato"
                        onClick={() => {
                          setServiciosContrato(c);
                          setServiciosOpen(true);
                        }}
                      >
                        <Zap className="h-4 w-4 text-amber-600" />
                      </Button>
                    )}
                    {perms.canEdit && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => openForm(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Aplicar reajuste"
                          disabled={c.estado !== "CONFIRMADO"}
                          onClick={() => {
                            setReajusteTarget(c);
                            setPorcentajeReajuste("5");
                            setOpenReajuste(true);
                          }}
                        >
                          <Percent className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {perms.canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("¿Eliminar?")) {
                            startTransition(async () => {
                              await eliminarContratoAction(c.id);
                              setItems((p) => p.filter((x) => x.id !== c.id));
                            });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </div>

      <Modal
        open={historialOpen}
        onClose={() => setHistorialOpen(false)}
        title={`Historial — ${historialTitulo}`}
        footer={
          <Button variant="secondary" onClick={() => setHistorialOpen(false)}>
            Cerrar
          </Button>
        }
      >
        <HistorialTimeline eventos={historialEventos} />
        <p className="mt-4 text-xs text-slate-500">
          Datos listos para futuro reporte PDF contractual (reportes-trazabilidad.service).
        </p>
      </Modal>

      <Modal
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        title={editing ? "Editar contrato" : "Nuevo contrato"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              type="submit"
              form="ctr-form"
              disabled={pending || (!editing && inmueblesOptions.length === 0)}
            >
              Guardar
            </Button>
          </>
        }
      >
        <form
          id="ctr-form"
          key={editing?.id ?? `new-${inmueblesOptions.map((i) => i.id).join(",")}`}
          onSubmit={handleSubmit}
          className="space-y-2"
        >
          {formError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          )}
          {!editing && inmueblesOptions.length === 0 ? (
            <p className="text-sm text-slate-600">
              Todos los inmuebles tienen un contrato activo.
            </p>
          ) : (
            <>
              <FormSection title="Datos generales">
                <FormField label="Inmueble">
                  <Select
                    name="inmuebleId"
                    defaultValue={editing?.inmuebleId ?? inmueblesOptions[0]?.id}
                    required
                  >
                    {inmueblesOptions.map((inm) => (
                      <option key={inm.id} value={inm.id}>
                        {inmuebleOptionLabel(inm)}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Inicio">
                    <Input name="fechaInicio" type="date" defaultValue={editing?.fechaInicio} required />
                  </FormField>
                  <FormField label="Fin">
                    <Input name="fechaFin" type="date" defaultValue={editing?.fechaFin} required />
                  </FormField>
                </div>
                {editing ? (
                  <FormField label="Estado">
                    <Select name="estado" defaultValue={editing.estado}>
                      {ESTADOS.map((e) => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </Select>
                  </FormField>
                ) : (
                  <input type="hidden" name="estado" value="PENDIENTE_CONFIRMACION" />
                )}
              </FormSection>

              <FormSection title="Partes del contrato">
                {!editing ? (
                  <>
                    <FormField label="Email del arrendatario">
                      <Input
                        name="emailArrendatario"
                        type="email"
                        placeholder="arrendatario@demo.edu"
                        required
                      />
                    </FormField>
                    <FormField label="Nombre del arrendatario">
                      <Input name="nombreArrendatario" placeholder="Nombre completo" />
                    </FormField>
                    <p className="text-xs text-slate-500">
                      Se enviará una invitación. El contrato quedará en{" "}
                      <strong>PENDIENTE_CONFIRMACION</strong> hasta que acepte.
                    </p>
                  </>
                ) : (
                  <FormField label="Arrendatario">
                    <Input
                      readOnly
                      defaultValue={
                        editing.nombreArrendatario
                          ? `${editing.nombreArrendatario} (${editing.emailArrendatario})`
                          : editing.emailArrendatario
                      }
                    />
                    <input type="hidden" name="emailArrendatario" value={editing.emailArrendatario} />
                    <input type="hidden" name="nombreArrendatario" value={editing.nombreArrendatario ?? ""} />
                    <input type="hidden" name="arrendatarioId" value={editing.arrendatarioId} />
                  </FormField>
                )}
                <input type="hidden" name="arrendadorId" value={usuarioId} />
              </FormSection>

              <FormSection title="Información económica">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Canon actual">
                    <Input
                      name="canonActual"
                      type="number"
                      defaultValue={editing?.canonActual}
                      required
                    />
                  </FormField>
                  <FormField label="Canon anterior">
                    <Input
                      name="canonAnterior"
                      type="number"
                      defaultValue={editing?.canonAnterior ?? 0}
                    />
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Depósito / garantía">
                    <Input
                      name="depositoGarantiaValor"
                      type="number"
                      defaultValue={editing?.depositoGarantiaValor ?? 0}
                    />
                  </FormField>
                  <FormField label="Estado depósito">
                    <Select
                      name="depositoGarantiaEstado"
                      defaultValue={editing?.depositoGarantiaEstado ?? "PENDIENTE"}
                    >
                      {DEPOSITO_ESTADOS.map((e) => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </Select>
                  </FormField>
                </div>
              </FormSection>

              <FormSection title="Prórroga y preaviso">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="prorrogaAutomatica"
                    defaultChecked={editing?.prorrogaAutomatica}
                    className="rounded border-slate-300"
                  />
                  Prórroga automática
                </label>
                <FormField label="Fecha límite de preaviso">
                  <Input
                    name="fechaLimitePreaviso"
                    type="date"
                    defaultValue={editing?.fechaLimitePreaviso ?? editing?.fechaFin}
                    required
                  />
                </FormField>
              </FormSection>

              <FormSection title="Codeudor / fiador">
                <FormField label="Nombre">
                  <Input name="codeudorNombre" defaultValue={editing?.codeudorNombre} />
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Documento">
                    <Input name="codeudorDocumento" defaultValue={editing?.codeudorDocumento} />
                  </FormField>
                  <FormField label="Teléfono">
                    <Input name="codeudorTelefono" defaultValue={editing?.codeudorTelefono} />
                  </FormField>
                </div>
                <FormField label="Email codeudor">
                  <Input name="codeudorEmail" type="email" defaultValue={editing?.codeudorEmail} />
                </FormField>
              </FormSection>

              <FormSection title="Inventario y documentos">
                <FormField label="Inventario de entrega">
                  <Input name="inventarioEntrega" defaultValue={editing?.inventarioEntrega} />
                </FormField>
                <FormField label="Observaciones de entrega">
                  <Input name="observacionesEntrega" defaultValue={editing?.observacionesEntrega} />
                </FormField>
                <MultiFileUploader
                  label="Documentos del contrato (firmado, cédulas, inventario…)"
                  value={documentosContrato}
                  onChange={handleDocumentosChange}
                  cargadoPor={cargadoPor}
                  allowDescriptions
                  onPendingFilesChange={setPendingDocFiles}
                  uploadContext={
                    editing
                      ? {
                          bucket: "contratos",
                          entidadTipo: "CONTRATO",
                          entidadId: editing.id,
                          contratoId: editing.id,
                          inmuebleId: editing.inmuebleId,
                          linkContratoId: editing.id,
                        }
                      : undefined
                  }
                />
                {editing && documentosContrato.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-2 text-xs font-medium text-slate-600">
                      Ver o descargar documentos ya cargados
                    </p>
                    <AttachmentsList
                      archivos={documentosContrato}
                      entidadTipo="CONTRATO"
                      entidadId={editing.id}
                      canDelete={perms.canEdit}
                      onDeleted={(id) =>
                        handleDocumentosChange(documentosContrato.filter((a) => a.id !== id))
                      }
                    />
                  </div>
                )}
              </FormSection>
            </>
          )}
        </form>
      </Modal>

      <Modal
        open={openReajuste}
        onClose={() => { setOpenReajuste(false); setReajusteTarget(null); }}
        title="Aplicar reajuste de canon"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenReajuste(false)}>Cancelar</Button>
            <Button onClick={handleReajuste} disabled={pending}>
              Aplicar
            </Button>
          </>
        }
      >
        {reajusteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Contrato <strong>{reajusteTarget.code}</strong> — canon actual{" "}
              {formatCurrency(reajusteTarget.canonActual)}
            </p>
            <FormField label="Porcentaje de reajuste (%)">
              <Input
                type="number"
                min={0.01}
                max={100}
                step={0.01}
                value={porcentajeReajuste}
                onChange={(e) => setPorcentajeReajuste(e.target.value)}
              />
            </FormField>
            <p className="text-xs text-slate-500">
              Se registrarán notificaciones simuladas para arrendador y arrendatario.
            </p>
          </div>
        )}
      </Modal>

      <ContratoServiciosModal
        contrato={serviciosContrato}
        open={serviciosOpen}
        onClose={() => {
          setServiciosOpen(false);
          setServiciosContrato(null);
        }}
        canEdit={perms.canEdit}
      />
    </>
  );
}

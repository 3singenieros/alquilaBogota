"use client";

import {
  actualizarContenidoMantenimientoAction,
  agregarComentarioMantenimientoAction,
  cambiarEstadoMantenimientoAction,
  crearMantenimientoAction,
  listarInmueblesMantenimientoFormAction,
  vincularEvidenciasMantenimientoAction,
} from "@/app/(dashboard)/mantenimiento/actions";
import { listarHistorialMantenimientoAction } from "@/app/(dashboard)/trazabilidad/actions";
import { HistorialTimeline } from "@/components/trazabilidad/historial-timeline";
import { VerAdjuntosButton } from "@/components/shared/adjuntos-panel";
import { MultiFileUploader } from "@/components/shared/multi-file-uploader";
import { MantenimientoModalsEconomicos } from "@/components/mantenimiento/mantenimiento-modals-economicos";
import type { CargadoPorAdjunto } from "@/lib/archivos-adjuntos";
import { esAdjuntoPendienteSubida, subirYVincularPostCreate } from "@/lib/adjuntos-client";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusBadge, estadoVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField, Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { inmuebleDisplayFromId, inmuebleOptionLabel, inmueblesById } from "@/lib/entity-labels";
import { getModulePermissions } from "@/lib/auth/permissions";
import {
  ESTADOS_MANTENIMIENTO,
  MENSAJE_EDICION_BLOQUEADA,
  arrendatarioPuedeEditarSolicitud,
  arrendadorPuedeGestionarEstado,
  puedeAgregarComentario,
} from "@/lib/mantenimiento-reglas";
import { formatDate } from "@/lib/utils";
import type {
  ArchivoAdjunto,
  ComentarioMantenimiento,
  EstadoMantenimiento,
  Inmueble,
  Mantenimiento,
  Rol,
} from "@/types";
import type { EventoTrazabilidad } from "@/types/trazabilidad";
import {
  Eye,
  GitBranch,
  History,
  MessageSquare,
  Pencil,
  Plus,
  DollarSign,
  Lock,
  CheckCircle,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";

function puedeEditarContenido(
  m: Mantenimiento,
  rol: Rol,
  usuarioId: string
): boolean {
  if (rol === "ADMIN") return true;
  if (rol === "ARRENDATARIO") {
    return (
      m.solicitadoPorId === usuarioId && arrendatarioPuedeEditarSolicitud(m.estado)
    );
  }
  return false;
}

export function MantenimientoModule({
  initialData,
  initialComentarios,
  inmuebles,
  rol,
  usuarioId,
  usuarioNombre,
  usuarioEmail,
}: {
  initialData: Mantenimiento[];
  initialComentarios: ComentarioMantenimiento[];
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
  const perms = getModulePermissions(rol, "mantenimiento");
  const canManageEstado = arrendadorPuedeGestionarEstado(rol);

  const [inmueblesOptions, setInmueblesOptions] = useState(inmuebles);
  const inmueblesMap = useMemo(() => inmueblesById(inmueblesOptions), [inmueblesOptions]);
  const [items, setItems] = useState(initialData);
  const [comentarios, setComentarios] = useState(initialComentarios);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [estadoOpen, setEstadoOpen] = useState(false);
  const [comentarioOpen, setComentarioOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [historialOpen, setHistorialOpen] = useState(false);
  const [responsabilidadOpen, setResponsabilidadOpen] = useState(false);
  const [cerrarOpen, setCerrarOpen] = useState(false);
  const [aceptarOpen, setAceptarOpen] = useState(false);
  const [evidenciasCreate, setEvidenciasCreate] = useState<ArchivoAdjunto[]>([]);
  const [evidenciasEdit, setEvidenciasEdit] = useState<ArchivoAdjunto[]>([]);
  const [pendingEvidenciasCreate, setPendingEvidenciasCreate] = useState<File[]>([]);
  const [selected, setSelected] = useState<Mantenimiento | null>(null);
  const [historialEventos, setHistorialEventos] = useState<EventoTrazabilidad[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setInmueblesOptions(inmuebles);
  }, [inmuebles]);

  const comentariosPorTicket = useMemo(() => {
    const map = new Map<string, ComentarioMantenimiento[]>();
    for (const c of comentarios) {
      const list = map.get(c.mantenimientoId) ?? [];
      list.push(c);
      map.set(c.mantenimientoId, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.fechaCreacion.localeCompare(b.fechaCreacion));
    }
    return map;
  }, [comentarios]);

  const filtered = useMemo(
    () =>
      items.filter((m) => {
        const matchSearch = !search || m.titulo.toLowerCase().includes(search.toLowerCase());
        const matchEstado = !estadoFilter || m.estado === estadoFilter;
        return matchSearch && matchEstado;
      }),
    [items, search, estadoFilter]
  );

  async function openCreateForm() {
    setFormError(null);
    const fresh = await listarInmueblesMantenimientoFormAction();
    setInmueblesOptions(fresh);
    if (fresh.length === 0) {
      setFormError(
        rol === "ARRENDATARIO"
          ? "No tienes un contrato confirmado con inmueble asociado para solicitar mantenimiento."
          : "No hay inmuebles disponibles para registrar mantenimiento."
      );
    }
    setOpen(true);
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    if (inmueblesOptions.length === 0) {
      setFormError("Selecciona un inmueble válido (contrato confirmado).");
      return;
    }
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      inmuebleId: fd.get("inmuebleId") as string,
      titulo: fd.get("titulo") as string,
      descripcion: fd.get("descripcion") as string,
      prioridad: fd.get("prioridad") as Mantenimiento["prioridad"],
      estado: "ABIERTO" as EstadoMantenimiento,
      solicitadoPorId: usuarioId,
      evidenciasAdjuntas: [],
    };
    startTransition(async () => {
      try {
        let uploadErr: string | null = null;
        let created = await crearMantenimientoAction(payload);
        const hayEvidenciasPendientes =
          pendingEvidenciasCreate.length > 0 ||
          evidenciasCreate.some(esAdjuntoPendienteSubida);
        if (created && pendingEvidenciasCreate.length > 0) {
          try {
            const updated = await subirYVincularPostCreate(
              created.id,
              pendingEvidenciasCreate,
              {
                bucket: "mantenimiento",
                entidadTipo: "MANTENIMIENTO",
                inmuebleId: created.inmuebleId,
                linkMantenimientoId: created.id,
                linkMantenimientoTipo: "EVIDENCIA",
              },
              (id, adj) => vincularEvidenciasMantenimientoAction(id, adj, "evidenciasAdjuntas")
            );
            if (updated && "code" in updated) {
              created = updated;
            }
          } catch (uploadEx) {
            uploadErr =
              uploadEx instanceof Error
                ? uploadEx.message
                : "No se pudieron subir las evidencias a Storage.";
          }
        } else if (created && hayEvidenciasPendientes) {
          uploadErr =
            "La solicitud se creó pero las evidencias no se subieron. Vuelve a intentarlo.";
        }
        if (created) {
          setItems((prev) => [...prev, created]);
          setEvidenciasCreate([]);
          setPendingEvidenciasCreate([]);
          form.reset();
          if (!uploadErr) {
            setOpen(false);
          } else {
            setFormError(uploadErr);
          }
        }
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "No se pudo crear la solicitud");
      }
    });
  }

  async function handleUpdateContenido(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    const payload: Partial<Mantenimiento> = {
      titulo: fd.get("titulo") as string,
      descripcion: fd.get("descripcion") as string,
      prioridad: fd.get("prioridad") as Mantenimiento["prioridad"],
      evidenciasAdjuntas:
        evidenciasEdit.length > 0 ? evidenciasEdit : selected.evidenciasAdjuntas,
    };
    startTransition(async () => {
      try {
        const updated = await actualizarContenidoMantenimientoAction(selected.id, payload);
        if (updated) {
          setItems((prev) => prev.map((m) => (m.id === selected.id ? { ...m, ...updated } : m)));
          setSelected(updated);
          setEditOpen(false);
        }
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "No se pudo actualizar");
      }
    });
  }

  async function handleCambioEstado(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    const estado = fd.get("estado") as EstadoMantenimiento;
    const motivoRechazo = (fd.get("motivoRechazo") as string) || undefined;
    startTransition(async () => {
      try {
        const updated = await cambiarEstadoMantenimientoAction(selected.id, {
          estado,
          asignadoA: (fd.get("asignadoA") as string) || undefined,
          observacionesGestion: (fd.get("observacionesGestion") as string) || undefined,
          motivoRechazo,
        });
        if (updated) {
          setItems((prev) => prev.map((m) => (m.id === selected.id ? { ...m, ...updated } : m)));
          setSelected(updated);
          setEstadoOpen(false);
        }
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "No se pudo cambiar el estado");
      }
    });
  }

  async function handleComentario(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const created = await agregarComentarioMantenimientoAction(selected.id, {
          comentario: fd.get("comentario") as string,
          adjuntoUrl: (fd.get("adjuntoUrl") as string) || undefined,
        });
        if (created) {
          setComentarios((prev) => [...prev, created]);
          setComentarioOpen(false);
        }
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "No se pudo agregar el comentario");
      }
    });
  }

  async function verHistorial(m: Mantenimiento) {
    const eventos = await listarHistorialMantenimientoAction(m.id);
    setHistorialEventos(eventos);
    setSelected(m);
    setHistorialOpen(true);
  }

  function selectTicket(m: Mantenimiento) {
    setSelected(m);
    setFormError(null);
  }

  const editDisabledReason =
    rol === "ARRENDATARIO" && selected && !arrendatarioPuedeEditarSolicitud(selected.estado)
      ? MENSAJE_EDICION_BLOQUEADA
      : undefined;

  return (
    <>
      <PageHeader
        pageTestId="page-mantenimiento"
        title="Mantenimiento"
        description={
          rol === "ARRENDATARIO"
            ? "Reporta incidencias del inmueble que arriendas"
            : "Gestiona solicitudes de mantenimiento de tus inmuebles"
        }
        action={
          perms.canCreate ? (
            <Button onClick={() => openCreateForm()}>
              <Plus className="h-4 w-4" /> Nueva solicitud
            </Button>
          ) : undefined
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        estado={estadoFilter}
        onEstadoChange={setEstadoFilter}
        estados={ESTADOS_MANTENIMIENTO.map((e) => ({ value: e, label: e }))}
        placeholder="Buscar por título..."
      />

      <Table>
        <thead>
          <tr>
            <Th>Código</Th>
            <Th>Título</Th>
            <Th>Inmueble</Th>
            <Th>Prioridad</Th>
            <Th>Estado</Th>
            <Th>Responsabilidad</Th>
            <Th>Adjuntos</Th>
            <Th>Asignado a</Th>
            <Th>Fecha</Th>
            <Th className="text-right">Acciones</Th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <Td colSpan={10} className="text-center text-sm text-slate-500">
                No hay solicitudes de mantenimiento.
              </Td>
            </tr>
          ) : (
            filtered.map((m) => {
              const editContent = puedeEditarContenido(m, rol, usuarioId);
              const editBlocked =
                rol === "ARRENDATARIO" && !arrendatarioPuedeEditarSolicitud(m.estado);
              const canComment = puedeAgregarComentario(rol, m.estado);
              return (
                <Tr key={m.id}>
                  <Td className="font-mono text-xs text-slate-600">{m.code}</Td>
                  <Td className="font-medium">{m.titulo}</Td>
                  <Td>{inmuebleDisplayFromId(m.inmuebleId, inmueblesMap)}</Td>
                  <Td>
                    <StatusBadge
                      label={m.prioridad}
                      variant={
                        m.prioridad === "ALTA"
                          ? "danger"
                          : m.prioridad === "MEDIA"
                            ? "warning"
                            : "neutral"
                      }
                    />
                  </Td>
                <Td>
                  <StatusBadge label={m.estado} variant={estadoVariant(m.estado)} />
                </Td>
                <Td className="text-xs">
                  {m.tipoResponsabilidad ?? "POR_DEFINIR"}
                  {m.aceptacionArrendatario === "PENDIENTE" && (
                    <span className="block text-amber-600">Aceptación pendiente</span>
                  )}
                </Td>
                <Td>
                  <VerAdjuntosButton
                    titulo={`Adjuntos — ${m.code}`}
                    entidadTipo="MANTENIMIENTO"
                    entidadId={m.id}
                    listas={[
                      {
                        etiqueta: "Evidencias",
                        archivos: m.evidenciasAdjuntas,
                        entidadTipo: "MANTENIMIENTO",
                        entidadId: m.id,
                        tipoDocumento: "EVIDENCIA",
                      },
                      {
                        etiqueta: "Cierre",
                        archivos: m.documentosCierreAdjuntos,
                        entidadTipo: "MANTENIMIENTO",
                        entidadId: m.id,
                        tipoDocumento: "CIERRE",
                      },
                    ]}
                  />
                </Td>
                <Td className="text-xs text-slate-600">{m.asignadoA ?? "—"}</Td>
                  <Td>{formatDate(m.creadoEn)}</Td>
                  <Td className="text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Ver detalle"
                        onClick={() => {
                          selectTicket(m);
                          setDetailOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {(rol === "ADMIN" ||
                        (rol === "ARRENDATARIO" && m.solicitadoPorId === usuarioId)) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          title={
                            editBlocked
                              ? MENSAJE_EDICION_BLOQUEADA
                              : "Editar solicitud"
                          }
                          disabled={editBlocked || !editContent}
                          onClick={() => {
                            selectTicket(m);
                            setEditOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canComment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Agregar comentario"
                          onClick={() => {
                            selectTicket(m);
                            setComentarioOpen(true);
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      )}
                      {canManageEstado && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Responsabilidad económica"
                            onClick={() => {
                              selectTicket(m);
                              setResponsabilidadOpen(true);
                            }}
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Cambiar estado"
                            onClick={() => {
                              selectTicket(m);
                              setEstadoOpen(true);
                            }}
                          >
                            <GitBranch className="h-4 w-4" />
                          </Button>
                          {m.estado !== "CERRADO" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Cerrar ticket"
                              onClick={() => {
                                selectTicket(m);
                                setCerrarOpen(true);
                              }}
                            >
                              <Lock className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                      {rol === "ARRENDATARIO" &&
                        m.tipoResponsabilidad === "COMPARTIDO" &&
                        m.aceptacionArrendatario === "PENDIENTE" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Aceptar o rechazar distribución"
                            onClick={() => {
                              selectTicket(m);
                              setAceptarOpen(true);
                            }}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Histórico"
                        onClick={() => verHistorial(m)}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                    </div>
                  </Td>
                </Tr>
              );
            })
          )}
        </tbody>
      </Table>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setFormError(null);
        }}
        title="Nueva solicitud de mantenimiento"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="mnt-create-form"
              disabled={pending || inmueblesOptions.length === 0}
            >
              Guardar
            </Button>
          </>
        }
      >
        {formError && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}
        {inmueblesOptions.length === 0 ? (
          <p className="text-sm text-slate-600">{formError}</p>
        ) : (
          <form id="mnt-create-form" onSubmit={handleCreate} className="space-y-4">
            <FormField label="Inmueble">
              <Select name="inmuebleId" defaultValue={inmueblesOptions[0]?.id} required>
                {inmueblesOptions.map((inm) => (
                  <option key={inm.id} value={inm.id}>
                    {inmuebleOptionLabel(inm)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Título">
              <Input name="titulo" required />
            </FormField>
            <FormField label="Descripción">
              <Input name="descripcion" required />
            </FormField>
            <FormField label="Prioridad">
              <Select name="prioridad" defaultValue="MEDIA">
                <option value="BAJA">BAJA</option>
                <option value="MEDIA">MEDIA</option>
                <option value="ALTA">ALTA</option>
              </Select>
            </FormField>
            <MultiFileUploader
              label="Evidencias iniciales"
              value={evidenciasCreate}
              onChange={setEvidenciasCreate}
              cargadoPor={cargadoPor}
              onPendingFilesChange={setPendingEvidenciasCreate}
            />
          </form>
        )}
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setFormError(null);
        }}
        title={`Editar solicitud — ${selected?.code ?? ""}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="mnt-edit-form"
              disabled={pending || !!editDisabledReason}
            >
              Guardar cambios
            </Button>
          </>
        }
      >
        {editDisabledReason && (
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {editDisabledReason}
          </p>
        )}
        {formError && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}
        {selected && !editDisabledReason && (
          <form id="mnt-edit-form" onSubmit={handleUpdateContenido} className="space-y-4">
            <FormField label="Título">
              <Input name="titulo" defaultValue={selected.titulo} required />
            </FormField>
            <FormField label="Descripción">
              <Input name="descripcion" defaultValue={selected.descripcion} required />
            </FormField>
            <FormField label="Prioridad">
              <Select name="prioridad" defaultValue={selected.prioridad}>
                <option value="BAJA">BAJA</option>
                <option value="MEDIA">MEDIA</option>
                <option value="ALTA">ALTA</option>
              </Select>
            </FormField>
            <MultiFileUploader
              label="Evidencias"
              value={evidenciasEdit.length ? evidenciasEdit : selected.evidenciasAdjuntas ?? []}
              onChange={setEvidenciasEdit}
              cargadoPor={cargadoPor}
              uploadContext={{
                bucket: "mantenimiento",
                entidadTipo: "MANTENIMIENTO",
                entidadId: selected.id,
                inmuebleId: selected.inmuebleId,
                linkMantenimientoId: selected.id,
                linkMantenimientoTipo: "EVIDENCIA",
              }}
            />
          </form>
        )}
      </Modal>

      <Modal
        open={estadoOpen}
        onClose={() => {
          setEstadoOpen(false);
          setFormError(null);
        }}
        title={`Cambiar estado — ${selected?.code ?? ""}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEstadoOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="mnt-estado-form" disabled={pending}>
              Aplicar
            </Button>
          </>
        }
      >
        {formError && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}
        {selected && (
          <form id="mnt-estado-form" onSubmit={handleCambioEstado} className="space-y-4">
            <p className="text-sm text-slate-600">
              Estado actual: <strong>{selected.estado}</strong>
            </p>
            <FormField label="Nuevo estado">
              <Select name="estado" defaultValue={selected.estado} required>
                    {ESTADOS_MANTENIMIENTO.filter((e) => e !== "CERRADO").map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <p className="text-xs text-slate-500">
                  Para cerrar el ticket usa el botón de cierre (candado).
                </p>
            <FormField label="Asignado a (proveedor)">
              <Input name="asignadoA" defaultValue={selected.asignadoA} />
            </FormField>
            <FormField label="Observaciones de gestión">
              <Input
                name="observacionesGestion"
                defaultValue={selected.observacionesGestion}
              />
            </FormField>
            <FormField label="Motivo de rechazo (si aplica RECHAZADO)">
              <Input name="motivoRechazo" placeholder="Obligatorio al rechazar" />
            </FormField>
          </form>
        )}
      </Modal>

      <Modal
        open={comentarioOpen}
        onClose={() => {
          setComentarioOpen(false);
          setFormError(null);
        }}
        title={`Comentario — ${selected?.code ?? ""}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setComentarioOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="mnt-comentario-form" disabled={pending}>
              Publicar
            </Button>
          </>
        }
      >
        {formError && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}
        {selected && (
          <form id="mnt-comentario-form" onSubmit={handleComentario} className="space-y-4">
            <FormField label="Comentario">
              <Input name="comentario" required placeholder="Actualización o consulta" />
            </FormField>
          </form>
        )}
      </Modal>

      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={selected?.titulo ?? "Detalle"}
        footer={
          <Button variant="secondary" onClick={() => setDetailOpen(false)}>
            Cerrar
          </Button>
        }
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <dl className="grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Código</dt>
                <dd className="font-mono">{selected.code}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Inmueble</dt>
                <dd>{inmuebleDisplayFromId(selected.inmuebleId, inmueblesMap)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-slate-500">Descripción (solicitud original)</dt>
                <dd>{selected.descripcion}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Estado</dt>
                <dd>
                  <StatusBadge label={selected.estado} variant={estadoVariant(selected.estado)} />
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Prioridad</dt>
                <dd>{selected.prioridad}</dd>
              </div>
              {selected.asignadoA && (
                <div>
                  <dt className="text-slate-500">Asignado a</dt>
                  <dd>{selected.asignadoA}</dd>
                </div>
              )}
              {selected.observacionesGestion && (
                <div className="sm:col-span-2">
                  <dt className="text-slate-500">Observaciones de gestión</dt>
                  <dd>{selected.observacionesGestion}</dd>
                </div>
              )}
              <div>
                <dt className="text-slate-500">Responsabilidad / tipo</dt>
                <dd>
                  {selected.tipoResponsabilidad ?? "POR_DEFINIR"} ·{" "}
                  {selected.tipoMantenimiento ?? "—"}
                  {selected.valorEstimado != null && (
                    <span className="block">
                      Estimado: ${selected.valorEstimado.toLocaleString("es-CO")}
                    </span>
                  )}
                  {selected.valorFinal != null && (
                    <span className="block">
                      Final: ${selected.valorFinal.toLocaleString("es-CO")}
                    </span>
                  )}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <VerAdjuntosButton
                  titulo="Adjuntos del ticket"
                  entidadTipo="MANTENIMIENTO"
                  entidadId={selected.id}
                  listas={[
                    {
                      etiqueta: "Evidencias",
                      archivos: selected.evidenciasAdjuntas,
                      entidadTipo: "MANTENIMIENTO",
                      entidadId: selected.id,
                      tipoDocumento: "EVIDENCIA",
                    },
                    {
                      etiqueta: "Cierre",
                      archivos: selected.documentosCierreAdjuntos,
                      entidadTipo: "MANTENIMIENTO",
                      entidadId: selected.id,
                      tipoDocumento: "CIERRE",
                    },
                  ]}
                />
              </div>
            </dl>

            <div>
              <h4 className="mb-2 font-medium text-slate-800">Comentarios</h4>
              {(comentariosPorTicket.get(selected.id) ?? []).length === 0 ? (
                <p className="text-slate-500">Sin comentarios aún.</p>
              ) : (
                <ul className="space-y-2">
                  {(comentariosPorTicket.get(selected.id) ?? []).map((c) => (
                    <li
                      key={c.id}
                      className="rounded-lg border border-[var(--border)] bg-slate-50 p-3"
                    >
                      <p className="text-xs text-slate-500">
                        {c.usuarioNombre} ({c.usuarioRol}) ·{" "}
                        {formatDate(c.fechaCreacion.slice(0, 10))}
                      </p>
                      <p className="mt-1">{c.comentario}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <Button
                variant="ghost"
                size="sm"
                className="text-indigo-600"
                onClick={() => verHistorial(selected)}
              >
                <History className="mr-1 h-4 w-4" />
                Ver historial completo
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={historialOpen}
        onClose={() => setHistorialOpen(false)}
        title={`Historial — ${selected?.code ?? ""}`}
        footer={
          <Button variant="secondary" onClick={() => setHistorialOpen(false)}>
            Cerrar
          </Button>
        }
      >
        <HistorialTimeline eventos={historialEventos} />
      </Modal>

      <MantenimientoModalsEconomicos
        selected={selected}
        responsabilidadOpen={responsabilidadOpen}
        cerrarOpen={cerrarOpen}
        aceptarOpen={aceptarOpen}
        onCloseResponsabilidad={() => setResponsabilidadOpen(false)}
        onCloseCerrar={() => setCerrarOpen(false)}
        onCloseAceptar={() => setAceptarOpen(false)}
        cargadoPor={cargadoPor}
        onUpdated={(m) => {
          setItems((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...m } : x)));
          setSelected(m);
        }}
      />
    </>
  );
}

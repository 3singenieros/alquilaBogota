"use client";

import { listarContratosFormAction } from "@/app/(dashboard)/contratos/actions";
import { listarInmueblesFormAction } from "@/app/(dashboard)/inmuebles/actions";
import {
  crearNoRenovacionAction,
  simularEnvioNotificacionNoRenovacionAction,
} from "@/app/(dashboard)/no-renovacion/actions";
import { SimulatedFileInput } from "@/components/shared/simulated-file-input";
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
import type { Contrato, Inmueble, NoRenovacion, Rol } from "@/types";
import { Mail, Plus } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";

export function NoRenovacionModule({
  initialData,
  contratos,
  inmuebles,
  rol,
  usuarioId,
}: {
  initialData: NoRenovacion[];
  contratos: Contrato[];
  inmuebles: Inmueble[];
  rol: Rol;
  usuarioId: string;
}) {
  const perms = getModulePermissions(rol, "no-renovacion");
  const [contratosOptions, setContratosOptions] = useState(contratos);
  const [inmueblesOptions, setInmueblesOptions] = useState(inmuebles);
  const inmueblesMap = useMemo(() => inmueblesById(inmueblesOptions), [inmueblesOptions]);
  const [items, setItems] = useState(initialData);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

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
    setOpen(true);
  }

  const filtered = useMemo(
    () =>
      items.filter((n) => {
        const matchSearch = !search || n.motivo.toLowerCase().includes(search.toLowerCase());
        const matchEstado = !estadoFilter || n.estado === estadoFilter;
        return matchSearch && matchEstado;
      }),
    [items, search, estadoFilter]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const contratoId = fd.get("contratoId") as string;
    const contrato = contratosOptions.find((c) => c.id === contratoId);
    const payload = {
      contratoId,
      motivo: fd.get("motivo") as string,
      fechaSolicitud: new Date().toISOString().slice(0, 10),
      estado: "SOLICITADA" as const,
      solicitadoPorId: usuarioId,
      documentoUrl: (fd.get("documentoUrl") as string) || undefined,
      fechaLimitePreaviso:
        (fd.get("fechaLimitePreaviso") as string) || contrato?.fechaLimitePreaviso || "",
      destinatarioArrendadorEmail:
        (fd.get("destinatarioArrendadorEmail") as string) || "arrendador@demo.edu",
      destinatarioArrendatarioEmail:
        (fd.get("destinatarioArrendatarioEmail") as string) || "arrendatario@demo.edu",
      estadoNotificacion: "PENDIENTE" as const,
      observacionesNotificacion: (fd.get("observacionesNotificacion") as string) || undefined,
    };
    startTransition(async () => {
      const created = await crearNoRenovacionAction(payload);
      if (created) setItems((prev) => [...prev, created]);
      setOpen(false);
    });
  }

  function simularEnvio(id: string) {
    startTransition(async () => {
      const updated = await simularEnvioNotificacionNoRenovacionAction(id);
      if (updated) {
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, ...updated } : n)));
      }
    });
  }

  return (
    <>
      <PageHeader
        title="No renovación"
        description="Vinculado a vencimiento del contrato, preaviso y notificación simulada"
        action={
          perms.canCreate ? (
            <Button onClick={() => openForm()}>
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
        estados={[
          { value: "SOLICITADA", label: "SOLICITADA" },
          { value: "EN_REVISION", label: "EN_REVISION" },
          { value: "ACEPTADA", label: "ACEPTADA" },
          { value: "RECHAZADA", label: "RECHAZADA" },
        ]}
      />
      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr>
              <Th>Código</Th>
              <Th>Contrato</Th>
              <Th>Motivo</Th>
              <Th>Preaviso límite</Th>
              <Th>Estado solicitud</Th>
              <Th>Notificación</Th>
              <Th>Envío simulado</Th>
              <Th className="text-right">Acción</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((n) => {
              const contrato = contratosOptions.find((c) => c.id === n.contratoId);
              return (
                <Tr key={n.id}>
                  <Td className="font-mono text-xs text-slate-600">{n.code}</Td>
                  <Td>
                    {contrato
                      ? contratoOptionLabel(contrato, inmueblesMap)
                      : n.contratoId}
                  </Td>
                  <Td>{n.motivo}</Td>
                  <Td>{formatDate(n.fechaLimitePreaviso)}</Td>
                  <Td>
                    <StatusBadge label={n.estado} variant={estadoVariant(n.estado)} />
                  </Td>
                  <Td>
                    <StatusBadge
                      label={n.estadoNotificacion}
                      variant={estadoVariant(n.estadoNotificacion)}
                    />
                  </Td>
                  <Td className="text-xs">
                    {n.fechaEnvioNotificacion
                      ? formatDate(n.fechaEnvioNotificacion.slice(0, 10))
                      : "—"}
                  </Td>
                  <Td className="text-right">
                    {n.estadoNotificacion === "PENDIENTE" &&
                      rol !== "ARRENDATARIO" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={pending}
                          onClick={() => simularEnvio(n.id)}
                        >
                          <Mail className="h-3.5 w-3.5" /> Simular envío
                        </Button>
                      )}
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Solicitud de no renovación"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="nr-form" disabled={pending}>
              Enviar
            </Button>
          </>
        }
      >
        <form id="nr-form" onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Contrato">
            <Select name="contratoId" defaultValue={contratosOptions[0]?.id} required>
              {contratosOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {contratoOptionLabel(c, inmueblesMap)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Motivo">
            <Input name="motivo" required />
          </FormField>
          <FormField label="Fecha límite de preaviso">
            <Input
              name="fechaLimitePreaviso"
              type="date"
              defaultValue={contratosOptions[0]?.fechaLimitePreaviso}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Email arrendador">
              <Input
                name="destinatarioArrendadorEmail"
                type="email"
                defaultValue="arrendador@demo.edu"
              />
            </FormField>
            <FormField label="Email arrendatario">
              <Input
                name="destinatarioArrendatarioEmail"
                type="email"
                defaultValue="arrendatario@demo.edu"
              />
            </FormField>
          </div>
          <FormField label="Documento / evidencia">
            <SimulatedFileInput name="documentoUrl" label="Carta o soporte (simulado)" />
          </FormField>
          <FormField label="Observaciones notificación">
            <Input name="observacionesNotificacion" placeholder="Opcional" />
          </FormField>
        </form>
      </Modal>
    </>
  );
}

"use client";

import {
  aceptarInvitacionAction,
  rechazarInvitacionAction,
} from "@/app/(dashboard)/solicitudes-contrato/actions";
import { StatusBadge, estadoVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField, Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { inmuebleDisplayFromId, inmueblesById, usuarioDisplayFromId, usuariosById } from "@/lib/entity-labels";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Contrato, Inmueble, InvitacionContrato, Usuario } from "@/types";
import { Check, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

export function SolicitudesContratoModule({
  invitaciones,
  contratos,
  inmuebles,
  usuarios,
}: {
  invitaciones: InvitacionContrato[];
  contratos: Contrato[];
  inmuebles: Inmueble[];
  usuarios: Usuario[];
}) {
  const inmueblesMap = useMemo(() => inmueblesById(inmuebles), [inmuebles]);
  const usuariosMap = useMemo(() => usuariosById(usuarios), [usuarios]);
  const [items, setItems] = useState(invitaciones);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<InvitacionContrato | null>(null);
  const [motivo, setMotivo] = useState("");
  const [pending, startTransition] = useTransition();

  const rows = useMemo(
    () =>
      items.map((inv) => ({
        inv,
        contrato: contratos.find((c) => c.id === inv.contratoId) ?? null,
      })),
    [items, contratos]
  );

  function aceptar(inv: InvitacionContrato) {
    startTransition(async () => {
      const result = await aceptarInvitacionAction(inv.id);
      if (result?.invitacion) {
        setItems((prev) =>
          prev.map((i) => (i.id === inv.id ? { ...i, ...result.invitacion! } : i))
        );
      }
    });
  }

  function confirmarRechazo() {
    if (!rejectTarget || !motivo.trim()) return;
    startTransition(async () => {
      const result = await rechazarInvitacionAction(rejectTarget.id, motivo);
      if (result?.invitacion) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === rejectTarget.id ? { ...i, ...result.invitacion! } : i
          )
        );
      }
      setRejectOpen(false);
      setRejectTarget(null);
      setMotivo("");
    });
  }

  return (
    <>
      <PageHeader
        title="Solicitudes de contrato"
        description="Invitaciones enviadas a tu correo — acepta o rechaza para confirmar el arrendamiento"
      />
      <Table>
        <thead>
          <tr>
            <Th>Inmueble</Th>
            <Th>Arrendador</Th>
            <Th>Canon</Th>
            <Th>Vigencia</Th>
            <Th>Documento</Th>
            <Th>Estado</Th>
            <Th className="text-right">Acciones</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <Td colSpan={7} className="text-center text-sm text-slate-500">
                No tienes solicitudes de contrato en este momento.
              </Td>
            </tr>
          ) : (
            rows.map(({ inv, contrato }) => (
              <Tr key={inv.id}>
                <Td>
                  {contrato
                    ? inmuebleDisplayFromId(contrato.inmuebleId, inmueblesMap)
                    : "—"}
                </Td>
                <Td className="text-xs">
                  {contrato
                    ? usuarioDisplayFromId(contrato.arrendadorId, usuariosMap)
                    : "—"}
                </Td>
                <Td>{contrato ? formatCurrency(contrato.canonActual) : "—"}</Td>
                <Td>
                  {contrato
                    ? `${formatDate(contrato.fechaInicio)} — ${formatDate(contrato.fechaFin)}`
                    : "—"}
                </Td>
                <Td className="max-w-[120px] truncate text-xs text-indigo-600">
                  {contrato?.documentoUrl ?? "—"}
                </Td>
                <Td>
                  <StatusBadge label={inv.estado} variant={estadoVariant(inv.estado)} />
                </Td>
                <Td className="text-right whitespace-nowrap">
                  {inv.estado === "PENDIENTE" && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={pending}
                        onClick={() => aceptar(inv)}
                      >
                        <Check className="h-3.5 w-3.5" /> Aceptar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() => {
                          setRejectTarget(inv);
                          setMotivo("");
                          setRejectOpen(true);
                        }}
                      >
                        <X className="h-3.5 w-3.5 text-red-500" /> Rechazar
                      </Button>
                    </>
                  )}
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </Table>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Rechazar contrato"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmarRechazo}
              disabled={pending || !motivo.trim()}
            >
              Confirmar rechazo
            </Button>
          </>
        }
      >
        <FormField label="Motivo del rechazo (obligatorio)">
          <Input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Explique brevemente el motivo"
            required
          />
        </FormField>
      </Modal>
    </>
  );
}

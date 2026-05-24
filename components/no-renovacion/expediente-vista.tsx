"use client";

import { HistorialTimeline } from "@/components/shared/historial-timeline";
import { StatusBadge, estadoVariant } from "@/components/ui/badge";
import { formatInmuebleDireccionCompleta } from "@/lib/inmueble-ubicacion";
import { formatDate } from "@/lib/utils";
import type { Contrato, Inmueble, NoRenovacion } from "@/types";
import type { EventoTrazabilidad } from "@/types/trazabilidad";

export function ExpedienteVista({
  expediente,
  contrato,
  inmueble,
  eventos,
}: {
  expediente: NoRenovacion;
  contrato: Contrato;
  inmueble: Inmueble;
  eventos: EventoTrazabilidad[];
}) {
  return (
    <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-slate-500">Contrato</span>
          <p className="font-medium">{contrato.code}</p>
        </div>
        <div>
          <span className="text-slate-500">Inmueble</span>
          <p>{inmueble.titulo}</p>
          <p className="text-xs text-slate-500">
            {formatInmuebleDireccionCompleta(inmueble)}
          </p>
          {inmueble.localidad ? (
            <p className="text-xs text-slate-400">Localidad: {inmueble.localidad}</p>
          ) : null}
        </div>
        <div>
          <span className="text-slate-500">Iniciado por</span>
          <p>
            {expediente.iniciadoPorNombre} ({expediente.iniciadoPorRol})
          </p>
        </div>
        <div>
          <span className="text-slate-500">Estado</span>
          <StatusBadge label={expediente.estado} variant={estadoVariant(expediente.estado)} />
        </div>
        <div>
          <span className="text-slate-500">Fecha creación</span>
          <p>{formatDate(expediente.fechaCreacion)}</p>
        </div>
        <div>
          <span className="text-slate-500">Documento generado</span>
          <p>
            {expediente.fechaGeneracionDocumento
              ? formatDate(expediente.fechaGeneracionDocumento.slice(0, 10))
              : "—"}
          </p>
        </div>
        <div>
          <span className="text-slate-500">Envío registrado</span>
          <p>
            {expediente.fechaEnvioRegistrado
              ? formatDate(expediente.fechaEnvioRegistrado.slice(0, 10))
              : "—"}
          </p>
        </div>
        <div>
          <span className="text-slate-500">Estado envío</span>
          <StatusBadge
            label={expediente.estadoEnvio}
            variant={estadoVariant(expediente.estadoEnvio)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
        <div>
          <h4 className="font-medium text-slate-800 mb-2">Remitente</h4>
          <p>{expediente.remitenteNombre}</p>
          <p className="text-xs text-slate-600">
            {expediente.remitenteTipoDocumento} {expediente.remitenteNumeroDocumento}
          </p>
          <p className="text-xs">{expediente.remitenteEmail}</p>
        </div>
        <div>
          <h4 className="font-medium text-slate-800 mb-2">Destinatario</h4>
          <p>{expediente.destinatarioNombre}</p>
          <p className="text-xs text-slate-600">
            {expediente.destinatarioTipoDocumento}{" "}
            {expediente.destinatarioNumeroDocumento}
          </p>
          <p className="text-xs">{expediente.destinatarioEmail}</p>
        </div>
      </div>

      {(expediente.medioEnvio || expediente.numeroGuiaCorreoCertificado) && (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3 text-sm">
          <h4 className="font-medium text-indigo-900 mb-2">Envío formal</h4>
          <p>Medio: {expediente.medioEnvio ?? "—"}</p>
          {expediente.empresaMensajeria && (
            <p>Mensajería: {expediente.empresaMensajeria}</p>
          )}
          {expediente.numeroGuiaCorreoCertificado && (
            <p>Guía: {expediente.numeroGuiaCorreoCertificado}</p>
          )}
        </div>
      )}

      {expediente.cuerpoComunicacionGenerado && (
        <div>
          <h4 className="font-medium text-slate-800 mb-2">Comunicación</h4>
          <pre className="text-xs whitespace-pre-wrap rounded border bg-white p-3 max-h-40 overflow-auto">
            {expediente.cuerpoComunicacionGenerado}
          </pre>
        </div>
      )}

      {(expediente.evidenciaEnvioAdjuntos?.length ?? 0) > 0 && (
        <div>
          <h4 className="font-medium text-slate-800 mb-2">Evidencias de envío</h4>
          <ul className="text-sm space-y-1">
            {expediente.evidenciaEnvioAdjuntos!.map((a) => (
              <li key={a.id} className="text-slate-600">
                {a.nombre}
                {a.descripcion ? ` — ${a.descripcion}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h4 className="font-medium text-slate-800 mb-2">Trazabilidad del expediente</h4>
        <HistorialTimeline eventos={eventos} />
      </div>
    </div>
  );
}

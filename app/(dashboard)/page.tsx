import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, estadoVariant } from "@/components/ui/badge";
import {
  ArrendatarioSinVinculosState,
  ArrendadorSinInmueblesState,
} from "@/components/shared/arrendatario-sin-vinculos-state";
import { getNavAccessSummary } from "@/services/access-control.service";
import {
  getActividadReciente,
  getDashboardResumen,
  getIncidencias,
  resumenContratoAlerta,
} from "@/services/dashboard.service";
import { requireSession } from "@/services/auth.service";
import type { Rol } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  Building2,
  FileText,
  Hammer,
  Receipt,
  Zap,
} from "lucide-react";

const STATS_BY_ROL: Record<
  Rol,
  Array<
    | "inmuebles"
    | "contratos"
    | "pagos"
    | "mantenimiento"
    | "servicios"
    | "notificaciones"
    | "solicitudes"
  >
> = {
  ADMIN: ["inmuebles", "contratos", "pagos", "mantenimiento", "servicios", "notificaciones", "solicitudes"],
  ARRENDADOR: ["inmuebles", "contratos", "pagos", "mantenimiento", "servicios", "notificaciones"],
  ARRENDATARIO: ["pagos", "mantenimiento", "servicios", "notificaciones", "solicitudes"],
};

export default async function DashboardPage() {
  const session = await requireSession();
  const [resumen, actividad, incidencias, navAccess] = await Promise.all([
    getDashboardResumen(),
    getActividadReciente(),
    getIncidencias(),
    getNavAccessSummary(),
  ]);

  const allStats = [
    {
      key: "inmuebles" as const,
      label: "Inmuebles",
      value: resumen.totalInmuebles,
      sub: `${resumen.inmueblesArrendados} arrendados`,
      icon: Building2,
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      key: "contratos" as const,
      label: "Contratos activos",
      value: resumen.contratosActivos,
      sub: `${resumen.contratosProximosVencerCount} próximos a vencer`,
      icon: FileText,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      key: "pagos" as const,
      label: "Pagos por validar",
      value: resumen.pagosPendientes,
      sub: `${resumen.pagosValidados} validados · ${resumen.pagosRechazados} rechazados`,
      icon: Receipt,
      color: "text-amber-600 bg-amber-50",
    },
    {
      key: "mantenimiento" as const,
      label: "Tickets mantenimiento",
      value: resumen.mantenimientoAbierto + resumen.mantenimientoEnGestion,
      sub: `${resumen.mantenimientoAbierto} abiertos · ${resumen.mantenimientoEnGestion} en gestión · ${resumen.mantenimientoCerrado} cerrados`,
      icon: Hammer,
      color: "text-sky-600 bg-sky-50",
    },
    {
      key: "servicios" as const,
      label: "Servicios por validar",
      value: resumen.serviciosPendientesValidacion,
      sub: `${resumen.serviciosVencidos} vencidos · ${resumen.serviciosValidados} validados`,
      icon: Zap,
      color: "text-amber-600 bg-amber-50",
    },
    {
      key: "notificaciones" as const,
      label: "Notificaciones pendientes",
      value: resumen.notificacionesPendientes,
      sub: "Envío simulado",
      icon: Bell,
      color: "text-violet-600 bg-violet-50",
    },
    {
      key: "solicitudes" as const,
      label: "Solicitudes pendientes",
      value: resumen.solicitudesPendientes,
      sub: "Invitaciones de contrato",
      icon: Bell,
      color: "text-sky-600 bg-sky-50",
    },
  ];

  const allowed = STATS_BY_ROL[session.usuario.rol];
  const stats = allStats.filter((s) => allowed.includes(s.key));

  return (
    <div data-testid="page-dashboard" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Resumen para {session.usuario.nombre} ({session.usuario.rol})
        </p>
      </div>

      {navAccess.arrendatarioSinVinculos && <ArrendatarioSinVinculosState />}
      {navAccess.arrendadorSinInmuebles && <ArrendadorSinInmueblesState />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-start justify-between pt-5">
              <div>
                <p className="text-sm text-slate-500">{s.label}</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{s.value}</p>
                <p className="mt-1 text-xs text-slate-500">{s.sub}</p>
              </div>
              <div className={`rounded-lg p-2.5 ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {session.usuario.rol !== "ARRENDATARIO" && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-slate-500">Ingresos estimados (cánones activos)</p>
            <p className="text-2xl font-bold text-indigo-600">
              {formatCurrency(resumen.ingresosEstimados)}
            </p>
          </CardContent>
        </Card>
      )}

      {(session.usuario.rol === "ADMIN" ||
        session.usuario.rol === "ARRENDADOR" ||
        session.usuario.rol === "ARRENDATARIO") && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-slate-500">Pagos de servicios rechazados</p>
              <p className="text-2xl font-bold text-slate-700">{resumen.serviciosRechazados}</p>
              <Link href="/servicios" className="mt-1 inline-block text-xs text-indigo-600">
                Ver servicios
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-slate-500">Servicios vencidos</p>
              <p className="text-2xl font-bold text-red-600">{resumen.serviciosVencidos}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-slate-500">Servicios validados</p>
              <p className="text-2xl font-bold text-emerald-600">{resumen.serviciosValidados}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-slate-500">Pendientes de validación</p>
              <p className="text-2xl font-bold text-amber-600">
                {resumen.serviciosPendientesValidacion}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {resumen.serviciosProximosVencer.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Servicios próximos a vencer (7 días)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {resumen.serviciosProximosVencer.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2 text-sm"
                >
                  <span>
                    {s.code} — periodo {s.periodo} · vence {formatDate(s.fechaVencimiento)}
                  </span>
                  <Link href="/servicios" className="text-xs font-medium text-indigo-600">
                    Ver
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        {resumen.serviciosVencidosLista.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Servicios vencidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {resumen.serviciosVencidosLista.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/50 px-3 py-2 text-sm"
                >
                  <span>
                    {s.code} — periodo {s.periodo} · vence {formatDate(s.fechaVencimiento)}
                  </span>
                  <Link href="/servicios" className="text-xs font-medium text-indigo-600">
                    Gestionar
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-slate-500">Pagos reportados pendientes</p>
            <p className="text-2xl font-bold text-amber-600">{resumen.pagosPendientes}</p>
            <Link href="/pagos" className="mt-1 inline-block text-xs text-indigo-600">
              Revisar pagos
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-slate-500">Pagos validados</p>
            <p className="text-2xl font-bold text-emerald-600">{resumen.pagosValidados}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-slate-500">Pagos rechazados</p>
            <p className="text-2xl font-bold text-red-600">{resumen.pagosRechazados}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-slate-500">Soportes PDF generados</p>
            <p className="text-2xl font-bold text-indigo-600">{resumen.soportesGenerados}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {session.usuario.rol !== "ARRENDATARIO" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pendientes de confirmación</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-600">
                {resumen.contratosPendientesConfirmacionCount}
              </p>
              <Link href="/contratos" className="mt-2 inline-block text-xs text-indigo-600">
                Ver contratos
              </Link>
            </CardContent>
          </Card>
        )}
        {session.usuario.rol === "ARRENDATARIO" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mis solicitudes pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-indigo-600">{resumen.solicitudesPendientes}</p>
              <Link
                href="/solicitudes-contrato"
                className="mt-2 inline-block text-xs text-indigo-600"
              >
                Revisar invitaciones
              </Link>
            </CardContent>
          </Card>
        )}
        {session.usuario.rol !== "ARRENDATARIO" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contratos rechazados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{resumen.contratosRechazadosCount}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contratos próximos a vencer (90 días)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {resumen.contratosProximosVencer.length === 0 ? (
              <p className="text-sm text-slate-500">Sin alertas de vencimiento.</p>
            ) : (
              resumen.contratosProximosVencer.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2 text-sm"
                >
                  <span>{resumenContratoAlerta(c)}</span>
                  <Link href="/contratos" className="text-xs font-medium text-indigo-600">
                    Ver
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preavisos vencidos (prórroga automática)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {resumen.preavisosVencidos.length === 0 ? (
              <p className="text-sm text-slate-500">Sin preavisos vencidos.</p>
            ) : (
              resumen.preavisosVencidos.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/50 px-3 py-2 text-sm"
                >
                  <span>
                    {c.code} — límite {formatDate(c.fechaLimitePreaviso)}
                  </span>
                  <Link href="/no-renovacion" className="text-xs font-medium text-indigo-600">
                    Gestionar
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actividad reciente (trazabilidad)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {actividad.length === 0 ? (
              <p className="text-sm text-slate-500">Sin eventos recientes en la bitácora.</p>
            ) : (
              actividad.map((a) => (
                <div
                  key={a.id}
                  className="flex gap-3 border-b border-[var(--border)] pb-3 last:border-0 last:pb-0"
                >
                  <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{a.descripcion}</p>
                    <p className="text-xs text-slate-500">
                      {a.accion} · {a.usuario} · {formatDate(a.fecha)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <Link href="/trazabilidad" className="mt-2 inline-block text-xs text-indigo-600">
              Ver bitácora completa
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Incidencias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {incidencias.map((i) => (
              <div
                key={i.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-[var(--border)] p-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{i.titulo}</p>
                  <p className="text-xs text-slate-500">
                    {i.modulo} · {formatDate(i.fecha)}
                  </p>
                </div>
                <StatusBadge
                  label={i.severidad}
                  variant={
                    i.severidad === "error"
                      ? "danger"
                      : i.severidad === "warning"
                        ? "warning"
                        : "info"
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

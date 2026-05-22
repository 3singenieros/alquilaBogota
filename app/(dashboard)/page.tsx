import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, estadoVariant } from "@/components/ui/badge";
import {
  getActividadReciente,
  getDashboardResumen,
  getIncidencias,
} from "@/services/dashboard.service";
import { requireSession } from "@/services/auth.service";
import type { Rol } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  AlertTriangle,
  Building2,
  FileText,
  Hammer,
  Receipt,
} from "lucide-react";

const STATS_BY_ROL: Record<
  Rol,
  Array<"inmuebles" | "contratos" | "pagos" | "mantenimiento">
> = {
  ADMIN: ["inmuebles", "contratos", "pagos", "mantenimiento"],
  ARRENDADOR: ["inmuebles", "contratos", "pagos", "mantenimiento"],
  ARRENDATARIO: ["pagos", "mantenimiento"],
};

export default async function DashboardPage() {
  const session = await requireSession();
  const [resumen, actividad, incidencias] = await Promise.all([
    getDashboardResumen(),
    getActividadReciente(),
    getIncidencias(),
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
      sub: "Vigentes",
      icon: FileText,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      key: "pagos" as const,
      label: "Pagos por validar",
      value: resumen.pagosPendientes,
      sub: "Reportados",
      icon: Receipt,
      color: "text-amber-600 bg-amber-50",
    },
    {
      key: "mantenimiento" as const,
      label: "Mantenimiento abierto",
      value: resumen.mantenimientoAbierto,
      sub: "Incidencias",
      icon: Hammer,
      color: "text-sky-600 bg-sky-50",
    },
  ];

  const allowed = STATS_BY_ROL[session.usuario.rol];
  const stats = allStats.filter((s) => allowed.includes(s.key));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Resumen para {session.usuario.nombre} ({session.usuario.rol})
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {actividad.map((a) => (
              <div key={a.id} className="flex gap-3 border-b border-[var(--border)] pb-3 last:border-0 last:pb-0">
                <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{a.descripcion}</p>
                  <p className="text-xs text-slate-500">
                    {a.modulo} · {formatDate(a.fecha)}
                  </p>
                </div>
              </div>
            ))}
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

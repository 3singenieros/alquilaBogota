import { cn } from "@/lib/utils";

const variants = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
  danger: "bg-red-50 text-red-700 ring-red-600/20",
  info: "bg-sky-50 text-sky-700 ring-sky-600/20",
  neutral: "bg-slate-100 text-slate-700 ring-slate-500/20",
  primary: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
};

export function StatusBadge({
  label,
  variant = "neutral",
}: {
  label: string;
  variant?: keyof typeof variants;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        variants[variant]
      )}
    >
      {label}
    </span>
  );
}

export function estadoVariant(estado: string): keyof typeof variants {
  const map: Record<string, keyof typeof variants> = {
    CONFIRMADO: "success",
    PENDIENTE_CONFIRMACION: "warning",
    BORRADOR: "neutral",
    RECHAZADO: "danger",
    CANCELADO: "neutral",
    ACEPTADA: "success",
    RECHAZADA: "danger",
    EXPIRADA: "neutral",
    ACTIVO: "success",
    VALIDADO: "success",
    PAGADO: "success",
    RESUELTO: "success",
    DISPONIBLE: "info",
    REPORTADO: "warning",
    PENDIENTE: "warning",
    EN_PROGRESO: "warning",
    EN_GESTION: "warning",
    EN_REVISION: "warning",
    SOLICITADA: "warning",
    PENDIENTE_GENERACION: "warning",
    DOCUMENTO_GENERADO: "info",
    ENVIO_REGISTRADO: "success",
    ANULADA: "neutral",
    REGISTRADO: "success",
    VENCIDO: "danger",
    ABIERTO: "info",
    ARRENDADO: "primary",
    MANTENIMIENTO: "warning",
    TERMINADO: "neutral",
    CERRADO: "neutral",
    SIMULADA: "success",
    DEVUELTO: "success",
    APLICADO: "primary",
    ERROR: "danger",
  };
  return map[estado] ?? "neutral";
}

import { Button } from "@/components/ui/button";
import Link from "next/link";

export function ArrendatarioSinVinculosState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center">
      <h2 className="text-lg font-semibold text-slate-900">
        No tienes contratos vinculados todavía
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
        Cuando un arrendador cree un contrato asociado a tu correo, aparecerá aquí una
        solicitud de confirmación.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/perfil">
          <Button variant="secondary">Ver perfil</Button>
        </Link>
        <Link href="/solicitudes-contrato">
          <Button>Revisar solicitudes pendientes</Button>
        </Link>
      </div>
    </div>
  );
}

export function TrazabilidadVaciaState() {
  return (
    <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
      No hay eventos disponibles para tu usuario.
    </p>
  );
}

export function ReportesVaciosState() {
  return (
    <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
      No hay información suficiente para generar reportes.
    </p>
  );
}

import { logoutAction } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/services/auth.service";
import Link from "next/link";

export default async function SinAccesoPage() {
  const session = await requireSession();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--background)] px-4 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Sin acceso</h1>
      <p className="max-w-md text-sm text-slate-600">
        Tu rol <strong>{session.usuario.rol}</strong> no puede abrir esta sección.
        Usa el menú lateral para ir a los módulos permitidos.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Ir al dashboard
        </Link>
        <form action={logoutAction}>
          <Button type="submit" variant="secondary">
            Cerrar sesión
          </Button>
        </form>
      </div>
    </div>
  );
}

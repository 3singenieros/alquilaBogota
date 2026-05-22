import { MantenimientoModule } from "@/components/modules/mantenimiento-module";
import { requireSession } from "@/services/auth.service";
import { listarContratosReferencia } from "@/services/contratos.service";
import { listarInmueblesReferencia } from "@/services/inmuebles.service";
import { listarMantenimiento } from "@/services/mantenimiento.service";

export default async function MantenimientoPage() {
  const session = await requireSession();
  const [items, contratos, inmuebles] = await Promise.all([
    listarMantenimiento(),
    listarContratosReferencia(),
    listarInmueblesReferencia(),
  ]);

  const inmuebleIds =
    session.usuario.rol === "ARRENDATARIO"
      ? [...new Set(contratos.map((c) => c.inmuebleId))]
      : inmuebles.map((i) => i.id);

  return (
    <MantenimientoModule
      initialData={items}
      rol={session.usuario.rol}
      usuarioId={session.usuario.id}
      inmuebleIds={inmuebleIds.length ? inmuebleIds : ["inm-1"]}
    />
  );
}

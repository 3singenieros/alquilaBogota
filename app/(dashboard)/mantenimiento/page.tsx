import { MantenimientoModule } from "@/components/modules/mantenimiento-module";
import { requireSession } from "@/services/auth.service";
import { listarInmueblesReferencia } from "@/services/inmuebles.service";
import { listarMantenimiento } from "@/services/mantenimiento.service";

export default async function MantenimientoPage() {
  const session = await requireSession();
  const [items, inmuebles] = await Promise.all([
    listarMantenimiento(),
    listarInmueblesReferencia(),
  ]);

  return (
    <MantenimientoModule
      initialData={items}
      inmuebles={inmuebles}
      rol={session.usuario.rol}
      usuarioId={session.usuario.id}
    />
  );
}

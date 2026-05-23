import { MantenimientoModule } from "@/components/modules/mantenimiento-module";
import { requireSession } from "@/services/auth.service";
import {
  listarComentariosVisibles,
  listarInmueblesParaMantenimiento,
  listarMantenimiento,
} from "@/services/mantenimiento.service";

export default async function MantenimientoPage() {
  const session = await requireSession();
  const [items, inmuebles, comentarios] = await Promise.all([
    listarMantenimiento(),
    listarInmueblesParaMantenimiento(),
    listarComentariosVisibles(),
  ]);

  return (
    <MantenimientoModule
      initialData={items}
      initialComentarios={comentarios}
      inmuebles={inmuebles}
      rol={session.usuario.rolActivo ?? session.usuario.rol}
      usuarioId={session.usuario.id}
    />
  );
}

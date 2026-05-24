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

  const u = session.usuario;
  return (
    <MantenimientoModule
      initialData={items}
      initialComentarios={comentarios}
      inmuebles={inmuebles}
      rol={u.rolActivo ?? u.rol}
      usuarioId={u.id}
      usuarioNombre={u.nombre}
      usuarioEmail={u.email}
    />
  );
}

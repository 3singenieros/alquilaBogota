import { NoRenovacionModule } from "@/components/modules/no-renovacion-module";
import { requireSession } from "@/services/auth.service";
import { listarContratosReferencia } from "@/services/contratos.service";
import { listarInmueblesReferencia } from "@/services/inmuebles.service";
import { listarNoRenovacion } from "@/services/no-renovacion.service";

export default async function NoRenovacionPage() {
  const session = await requireSession();
  const [items, contratos, inmuebles] = await Promise.all([
    listarNoRenovacion(),
    listarContratosReferencia(),
    listarInmueblesReferencia(),
  ]);

  return (
    <NoRenovacionModule
      initialData={items}
      contratos={contratos}
      inmuebles={inmuebles}
      rol={session.usuario.rolActivo ?? session.usuario.rol}
      usuarioId={session.usuario.id}
      usuarioNombre={session.usuario.nombre}
      usuarioEmail={session.usuario.email}
    />
  );
}

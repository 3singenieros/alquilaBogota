import { NoRenovacionModule } from "@/components/modules/no-renovacion-module";
import { requireSession } from "@/services/auth.service";
import { listarContratosReferencia } from "@/services/contratos.service";
import { listarNoRenovacion } from "@/services/no-renovacion.service";

export default async function NoRenovacionPage() {
  const session = await requireSession();
  const [items, contratos] = await Promise.all([
    listarNoRenovacion(),
    listarContratosReferencia(),
  ]);

  return (
    <NoRenovacionModule
      initialData={items}
      contratos={contratos}
      rol={session.usuario.rol}
      usuarioId={session.usuario.id}
    />
  );
}

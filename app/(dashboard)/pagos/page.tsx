import { PagosModule } from "@/components/modules/pagos-module";
import { requireSession } from "@/services/auth.service";
import { listarContratosReferencia } from "@/services/contratos.service";
import { listarPagos } from "@/services/pagos.service";

export default async function PagosPage() {
  const session = await requireSession();
  const [pagos, contratos] = await Promise.all([
    listarPagos(),
    listarContratosReferencia(),
  ]);

  return (
    <PagosModule
      initialData={pagos}
      contratos={contratos}
      rol={session.usuario.rol}
      usuarioId={session.usuario.id}
    />
  );
}

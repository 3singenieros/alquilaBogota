import { PagosModule } from "@/components/modules/pagos-module";
import { requireSession } from "@/services/auth.service";
import { listarContratosReferencia } from "@/services/contratos.service";
import { listarInmueblesReferencia } from "@/services/inmuebles.service";
import { listarPagos } from "@/services/pagos.service";

export default async function PagosPage() {
  const session = await requireSession();
  const [pagos, contratos, inmuebles] = await Promise.all([
    listarPagos(),
    listarContratosReferencia(),
    listarInmueblesReferencia(),
  ]);

  return (
    <PagosModule
      initialData={pagos}
      contratos={contratos}
      inmuebles={inmuebles}
      rol={session.usuario.rol}
      usuarioId={session.usuario.id}
    />
  );
}

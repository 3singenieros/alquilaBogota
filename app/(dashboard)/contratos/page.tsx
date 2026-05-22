import { ContratosModule } from "@/components/modules/contratos-module";
import { requireSession } from "@/services/auth.service";
import { listarContratos } from "@/services/contratos.service";
import { listarInmuebles } from "@/services/inmuebles.service";

export default async function ContratosPage() {
  const session = await requireSession();
  const [contratos, inmuebles] = await Promise.all([
    listarContratos(),
    listarInmuebles(),
  ]);
  return (
    <ContratosModule
      initialData={contratos}
      inmuebles={inmuebles}
      rol={session.usuario.rol}
      usuarioId={session.usuario.id}
    />
  );
}

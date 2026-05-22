import { ContratosModule } from "@/components/modules/contratos-module";
import { requireSession } from "@/services/auth.service";
import { listarContratos } from "@/services/contratos.service";

export default async function ContratosPage() {
  const session = await requireSession();
  const contratos = await listarContratos();
  return (
    <ContratosModule
      initialData={contratos}
      rol={session.usuario.rol}
      usuarioId={session.usuario.id}
    />
  );
}

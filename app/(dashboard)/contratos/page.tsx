import { ContratosModule } from "@/components/modules/contratos-module";
import { listarContratos } from "@/services/contratos.service";

export default async function ContratosPage() {
  const data = await listarContratos();
  return <ContratosModule initialData={data} />;
}

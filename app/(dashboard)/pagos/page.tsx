import { PagosModule } from "@/components/modules/pagos-module";
import { listarPagos } from "@/services/pagos.service";

export default async function PagosPage() {
  return <PagosModule initialData={await listarPagos()} />;
}

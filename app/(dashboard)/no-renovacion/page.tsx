import { NoRenovacionModule } from "@/components/modules/no-renovacion-module";
import { listarNoRenovacion } from "@/services/no-renovacion.service";

export default async function NoRenovacionPage() {
  return <NoRenovacionModule initialData={await listarNoRenovacion()} />;
}

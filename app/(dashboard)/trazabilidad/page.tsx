import { TrazabilidadModule } from "@/components/modules/trazabilidad-module";
import { listarEventos } from "@/services/trazabilidad.service";

export default async function TrazabilidadPage() {
  const eventos = await listarEventos();
  return <TrazabilidadModule initialData={eventos} />;
}

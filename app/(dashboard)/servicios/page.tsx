import { ServiciosModule } from "@/components/modules/servicios-module";
import { listarServicios } from "@/services/servicios.service";

export default async function ServiciosPage() {
  return <ServiciosModule initialData={await listarServicios()} />;
}

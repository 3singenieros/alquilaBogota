import { ServiciosModule } from "@/components/modules/servicios-module";
import { requireSession } from "@/services/auth.service";
import { listarServicios } from "@/services/servicios.service";

export default async function ServiciosPage() {
  const session = await requireSession();
  return (
    <ServiciosModule initialData={await listarServicios()} rol={session.usuario.rol} />
  );
}

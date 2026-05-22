import { ServiciosModule } from "@/components/modules/servicios-module";
import { requireSession } from "@/services/auth.service";
import { listarInmueblesReferencia } from "@/services/inmuebles.service";
import { listarServicios } from "@/services/servicios.service";

export default async function ServiciosPage() {
  const session = await requireSession();
  const [servicios, inmuebles] = await Promise.all([
    listarServicios(),
    listarInmueblesReferencia(),
  ]);
  return (
    <ServiciosModule
      initialData={servicios}
      inmuebles={inmuebles}
      rol={session.usuario.rol}
    />
  );
}

import { ServiciosModule } from "@/components/modules/servicios-module";
import { requireSession } from "@/services/auth.service";
import { listarContratosReferencia } from "@/services/contratos.service";
import { listarPagosServicio } from "@/services/pagos-servicio.service";
import { listarServiciosContrato } from "@/services/servicios-contrato.service";

export default async function ServiciosPage() {
  const session = await requireSession();
  const [serviciosContrato, pagos, contratos] = await Promise.all([
    listarServiciosContrato(),
    listarPagosServicio(),
    listarContratosReferencia(),
  ]);
  return (
    <ServiciosModule
      serviciosContrato={serviciosContrato}
      pagos={pagos}
      contratos={contratos}
      rol={session.usuario.rolActivo ?? session.usuario.rol}
    />
  );
}

import { SolicitudesContratoModule } from "@/components/modules/solicitudes-contrato-module";
import { listarContratosReferencia } from "@/services/contratos.service";
import { listarSolicitudesContratoParaSesion } from "@/services/invitaciones-contrato.service";
import { listarUsuariosReferencia } from "@/services/usuarios-referencia.service";
import { listarInmueblesReferencia } from "@/services/inmuebles.service";

export default async function SolicitudesContratoPage() {
  const [invitaciones, contratos, inmuebles, usuarios] = await Promise.all([
    listarSolicitudesContratoParaSesion(),
    listarContratosReferencia(),
    listarInmueblesReferencia(),
    listarUsuariosReferencia(),
  ]);

  return (
    <SolicitudesContratoModule
      invitaciones={invitaciones}
      contratos={contratos}
      inmuebles={inmuebles}
      usuarios={usuarios}
    />
  );
}

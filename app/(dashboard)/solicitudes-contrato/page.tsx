import { SolicitudesContratoModule } from "@/components/modules/solicitudes-contrato-module";
import { requireCompletedProfile } from "@/services/auth.service";
import { listarContratosReferencia } from "@/services/contratos.service";
import { listarSolicitudesContratoParaSesion } from "@/services/invitaciones-contrato.service";
import { listarUsuariosReferencia } from "@/services/usuarios-referencia.service";
import { listarInmueblesReferencia } from "@/services/inmuebles.service";

export default async function SolicitudesContratoPage() {
  const { usuario } = await requireCompletedProfile();
  const roles = usuario.roles ?? [usuario.rol];
  const [invitaciones, contratos, inmuebles, usuarios] = await Promise.all([
    listarSolicitudesContratoParaSesion(),
    listarContratosReferencia(),
    listarInmueblesReferencia(),
    listarUsuariosReferencia(),
  ]);

  const showRoleHint =
    roles.includes("ARRENDATARIO") &&
    roles.includes("ARRENDADOR") &&
    (usuario.rolActivo ?? usuario.rol) === "ARRENDADOR" &&
    invitaciones.some((i) => i.estado === "PENDIENTE");

  return (
    <SolicitudesContratoModule
      invitaciones={invitaciones}
      contratos={contratos}
      inmuebles={inmuebles}
      usuarios={usuarios}
      showRoleHint={showRoleHint}
    />
  );
}

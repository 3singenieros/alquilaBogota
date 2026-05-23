import { ContratosModule } from "@/components/modules/contratos-module";
import { requireSession } from "@/services/auth.service";
import { listarContratos, listarInmueblesParaContrato } from "@/services/contratos.service";
import { listarUsuariosReferencia } from "@/services/usuarios-referencia.service";

export default async function ContratosPage() {
  const session = await requireSession();
  const [contratos, inmuebles, usuarios] = await Promise.all([
    listarContratos(),
    listarInmueblesParaContrato(),
    listarUsuariosReferencia(),
  ]);
  return (
    <ContratosModule
      initialData={contratos}
      inmuebles={inmuebles}
      arrendatarios={usuarios.filter((u) => u.rol === "ARRENDATARIO")}
      rol={session.usuario.rol}
      usuarioId={session.usuario.id}
    />
  );
}

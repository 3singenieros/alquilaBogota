import { UsuariosModule } from "@/components/modules/usuarios-module";
import { requireSession } from "@/services/auth.service";
import { listarUsuarios } from "@/services/usuarios.service";

export default async function UsuariosPage() {
  const session = await requireSession();
  return (
    <UsuariosModule initialData={await listarUsuarios()} rol={session.usuario.rol} />
  );
}

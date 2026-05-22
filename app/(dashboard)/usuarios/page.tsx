import { UsuariosModule } from "@/components/modules/usuarios-module";
import { listarUsuarios } from "@/services/usuarios.service";

export default async function UsuariosPage() {
  return <UsuariosModule initialData={await listarUsuarios()} />;
}

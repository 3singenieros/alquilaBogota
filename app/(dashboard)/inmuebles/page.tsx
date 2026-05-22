import { InmueblesModule } from "@/components/modules/inmuebles-module";
import { requireSession } from "@/services/auth.service";
import { listarInmuebles } from "@/services/inmuebles.service";

export default async function InmueblesPage() {
  const session = await requireSession();
  const inmuebles = await listarInmuebles();
  return (
    <InmueblesModule
      initialData={inmuebles}
      rol={session.usuario.rol}
      usuarioId={session.usuario.id}
    />
  );
}

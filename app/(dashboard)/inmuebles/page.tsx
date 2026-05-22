import { InmueblesModule } from "@/components/modules/inmuebles-module";
import { listarInmuebles } from "@/services/inmuebles.service";

export default async function InmueblesPage() {
  const inmuebles = await listarInmuebles();
  return <InmueblesModule initialData={inmuebles} />;
}

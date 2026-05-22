import { MantenimientoModule } from "@/components/modules/mantenimiento-module";
import { listarMantenimiento } from "@/services/mantenimiento.service";

export default async function MantenimientoPage() {
  return <MantenimientoModule initialData={await listarMantenimiento()} />;
}

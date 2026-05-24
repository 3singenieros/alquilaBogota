import { ReportesModule } from "@/components/modules/reportes-module";
import { listarOpcionesReportes } from "@/services/reportes.service";

export default async function ReportesPage() {
  const opciones = await listarOpcionesReportes();

  return (
    <ReportesModule
      contratos={opciones.contratos}
      inmuebles={opciones.inmuebles}
      noRenovaciones={opciones.noRenovaciones}
      mantenimientos={opciones.mantenimientos}
    />
  );
}

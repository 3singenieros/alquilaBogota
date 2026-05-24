import { PagosModule } from "@/components/modules/pagos-module";
import { requireSession } from "@/services/auth.service";
import { listarContratosReferencia } from "@/services/contratos.service";
import { listarInmueblesReferencia } from "@/services/inmuebles.service";
import { listarPagos } from "@/services/pagos.service";
import {
  listarSoportesPago,
  obtenerDatosPdfSoporte,
} from "@/services/soporte-pago.service";
import type { SoportePdfData } from "@/types/soporte-pago";
import type { SoportePago } from "@/types/soporte-pago";

export default async function PagosPage() {
  const session = await requireSession();
  const [pagos, contratos, inmuebles, soportes] = await Promise.all([
    listarPagos(),
    listarContratosReferencia(),
    listarInmueblesReferencia(),
    listarSoportesPago(),
  ]);

  const pdfPorPagoId: Record<string, SoportePdfData> = {};
  await Promise.all(
    soportes.map(async (s: SoportePago) => {
      const data = await obtenerDatosPdfSoporte(s.id);
      if (data) pdfPorPagoId[s.pagoId] = data;
    })
  );

  return (
    <PagosModule
      initialData={pagos}
      contratos={contratos}
      inmuebles={inmuebles}
      soportes={soportes}
      pdfPorPagoId={pdfPorPagoId}
      rol={session.usuario.rolActivo ?? session.usuario.rol}
      usuarioId={session.usuario.id}
      usuarioNombre={session.usuario.nombre}
      usuarioEmail={session.usuario.email}
    />
  );
}

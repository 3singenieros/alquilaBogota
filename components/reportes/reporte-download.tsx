"use client";

import { ReporteGenericoPdfDocument } from "@/components/pdf/reporte-generico-pdf";
import { Button } from "@/components/ui/button";
import type { ReporteDocumento } from "@/types/reportes";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download } from "lucide-react";

export function ReporteDownload({
  reporte,
  size = "sm",
}: {
  reporte: ReporteDocumento;
  size?: "sm" | "md";
}) {
  const fileName = `reporte-${reporte.tipo.toLowerCase()}-${reporte.fechaGeneracion.slice(0, 10)}.pdf`;

  return (
    <PDFDownloadLink
      document={<ReporteGenericoPdfDocument reporte={reporte} />}
      fileName={fileName}
    >
      {({ loading }) => (
        <Button variant="secondary" size={size} disabled={loading} type="button">
          <Download className="h-3.5 w-3.5" />
          {loading ? "Generando PDF..." : "Descargar PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}

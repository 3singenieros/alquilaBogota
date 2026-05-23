"use client";

import { SoportePagoPdfDocument } from "@/components/pdf/soporte-pago-pdf";
import { Button } from "@/components/ui/button";
import type { SoportePdfData } from "@/types/soporte-pago";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download } from "lucide-react";

export function SoportePagoDownload({
  data,
  size = "sm",
}: {
  data: SoportePdfData;
  size?: "sm" | "md";
}) {
  const fileName = `soporte-${data.soporte.numeroSoporte}.pdf`;

  return (
    <PDFDownloadLink
      document={<SoportePagoPdfDocument data={data} />}
      fileName={fileName}
    >
      {({ loading }) => (
        <Button variant="secondary" size={size} disabled={loading} type="button">
          <Download className="h-3.5 w-3.5" />
          {loading ? "Generando PDF..." : "Descargar soporte PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}

"use client";

import { registrarDescargaPdfNoRenovacionAction } from "@/app/(dashboard)/no-renovacion/actions";
import { NoRenovacionPdfDocument } from "@/components/pdf/no-renovacion-pdf";
import { Button } from "@/components/ui/button";
import type { NoRenovacionPdfData } from "@/types/no-renovacion-pdf";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download } from "lucide-react";

export function NoRenovacionDownload({
  expedienteId,
  data,
  size = "sm",
  onTraced,
}: {
  expedienteId: string;
  data: NoRenovacionPdfData;
  size?: "sm" | "md";
  onTraced?: () => void;
}) {
  const fileName = `no-renovacion-${data.expediente.code}.pdf`;

  return (
    <PDFDownloadLink
      document={<NoRenovacionPdfDocument data={data} />}
      fileName={fileName}
    >
      {({ loading }) => (
        <Button
          variant="secondary"
          size={size}
          disabled={loading}
          type="button"
          onClick={async () => {
            await registrarDescargaPdfNoRenovacionAction(expedienteId);
            onTraced?.();
          }}
        >
          <Download className="h-3.5 w-3.5" />
          {loading ? "Generando PDF..." : "Descargar carta PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}

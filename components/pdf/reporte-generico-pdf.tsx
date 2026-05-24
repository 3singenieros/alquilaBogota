"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { ReportFooter, ReportHeader } from "@/components/pdf/report-layout";
import { ReportSectionPdf } from "@/components/pdf/report-section";
import { SignatureBlockPdf } from "@/components/pdf/signature-block";
import { formatDate } from "@/lib/utils";
import type { ReporteDocumento } from "@/types/reportes";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  resumen: { marginBottom: 12, padding: 8, backgroundColor: "#f8f8f8" },
  resumenTitle: { fontSize: 10, fontWeight: "bold", marginBottom: 4 },
  filtros: { fontSize: 8, color: "#555", marginBottom: 10 },
  evento: { fontSize: 8, marginBottom: 3, paddingLeft: 4 },
});

export function ReporteGenericoPdfDocument({ reporte }: { reporte: ReporteDocumento }) {
  const filtros = Object.entries(reporte.filtrosAplicados);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ReportHeader reporte={reporte} />

        {filtros.length > 0 && (
          <Text style={styles.filtros}>
            Filtros: {filtros.map(([k, v]) => `${k}: ${v}`).join(" · ")}
          </Text>
        )}

        {reporte.resumen.length > 0 && (
          <View style={styles.resumen}>
            <Text style={styles.resumenTitle}>Resumen</Text>
            {reporte.resumen.map((r, i) => (
              <Text key={i}>
                {r.etiqueta}: {r.valor}
              </Text>
            ))}
          </View>
        )}

        {reporte.secciones.map((s) => (
          <ReportSectionPdf key={s.id} seccion={s} />
        ))}

        {reporte.eventosTrazabilidad.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.resumenTitle}>
              Línea de tiempo ({reporte.eventosTrazabilidad.length} eventos)
            </Text>
            {reporte.eventosTrazabilidad.slice(0, 35).map((e) => (
              <Text key={e.id} style={styles.evento}>
                {formatDate(e.fechaHora.slice(0, 10))} · {e.accion} · {e.descripcion.slice(0, 80)}
              </Text>
            ))}
          </View>
        )}

        <SignatureBlockPdf firmas={reporte.firmasRequeridas} />
        <ReportFooter />
      </Page>
    </Document>
  );
}

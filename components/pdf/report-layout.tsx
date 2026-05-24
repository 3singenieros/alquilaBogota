"use client";

import { Text, View, StyleSheet } from "@react-pdf/renderer";
import { APP_NOMBRE } from "@/lib/reportes/base-reporte";
import { formatDate } from "@/lib/utils";
import type { ReporteDocumento } from "@/types/reportes";

const styles = StyleSheet.create({
  header: { marginBottom: 16, borderBottomWidth: 1, borderBottomColor: "#ddd", paddingBottom: 8 },
  appName: { fontSize: 10, color: "#666" },
  title: { fontSize: 16, fontWeight: "bold", marginTop: 4 },
  subtitle: { fontSize: 10, color: "#555", marginTop: 2 },
  meta: { fontSize: 9, color: "#666", marginTop: 6 },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#888",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 6,
  },
});

export function ReportHeader({ reporte }: { reporte: ReporteDocumento }) {
  return (
    <View style={styles.header}>
      <Text style={styles.appName}>{APP_NOMBRE}</Text>
      <Text style={styles.title}>{reporte.titulo}</Text>
      {reporte.subtitulo ? <Text style={styles.subtitle}>{reporte.subtitulo}</Text> : null}
      <Text style={styles.meta}>
        Generado: {formatDate(reporte.fechaGeneracion.slice(0, 10))} ·{" "}
        {reporte.generadoPor.nombre} ({reporte.generadoPor.rol})
      </Text>
    </View>
  );
}

export function ReportFooter() {
  return (
    <Text style={styles.footer} fixed>
      Documento generado automáticamente por el prototipo académico.
    </Text>
  );
}

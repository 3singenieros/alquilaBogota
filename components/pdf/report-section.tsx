"use client";

import { Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ReporteSeccion } from "@/types/reportes";

const styles = StyleSheet.create({
  section: { marginBottom: 12 },
  title: { fontSize: 11, fontWeight: "bold", marginBottom: 4 },
  desc: { fontSize: 9, color: "#666", marginBottom: 4 },
  row: { flexDirection: "row", marginBottom: 2 },
  label: { width: 120, fontSize: 9, color: "#444" },
  value: { flex: 1, fontSize: 9 },
  cell: { fontSize: 8, padding: 2 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f0f0f0", marginBottom: 2 },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#eee" },
  texto: { fontSize: 8, lineHeight: 1.35, marginTop: 4 },
});

export function ReportSectionPdf({ seccion }: { seccion: ReporteSeccion }) {
  const colWidth = seccion.tabla
    ? `${100 / seccion.tabla.columnas.length}%`
    : "33%";

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{seccion.titulo}</Text>
      {seccion.descripcion ? <Text style={styles.desc}>{seccion.descripcion}</Text> : null}
      {seccion.filas?.map((f, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.label}>{f.etiqueta}</Text>
          <Text style={styles.value}>{f.valor}</Text>
        </View>
      ))}
      {seccion.tabla && (
        <View>
          <View style={styles.tableHeader}>
            {seccion.tabla.columnas.map((c, i) => (
              <Text key={i} style={[styles.cell, { width: colWidth }]}>
                {c}
              </Text>
            ))}
          </View>
          {seccion.tabla.filas.slice(0, 40).map((fila, ri) => (
            <View key={ri} style={styles.tableRow}>
              {fila.map((cell, ci) => (
                <Text key={ci} style={[styles.cell, { width: colWidth }]}>
                  {cell}
                </Text>
              ))}
            </View>
          ))}
        </View>
      )}
      {seccion.texto ? <Text style={styles.texto}>{seccion.texto.slice(0, 2000)}</Text> : null}
    </View>
  );
}

"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { SoportePdfData } from "@/types/soporte-pago";
import { formatCurrency, formatDate } from "@/lib/utils";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 8, fontWeight: "bold" },
  subtitle: { fontSize: 10, color: "#555", marginBottom: 20 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 6 },
  row: { flexDirection: "row", marginBottom: 4 },
  label: { width: 140, color: "#444" },
  value: { flex: 1 },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    fontSize: 9,
    color: "#666",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 10,
  },
  cert: {
    marginTop: 16,
    padding: 10,
    backgroundColor: "#f5f5f5",
    fontSize: 10,
    fontStyle: "italic",
  },
});

export function SoportePagoPdfDocument({ data }: { data: SoportePdfData }) {
  const { soporte } = data;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Soporte de pago de arrendamiento</Text>
        <Text style={styles.subtitle}>
          Número de soporte: {soporte.numeroSoporte} · Generado el{" "}
          {formatDate(soporte.fechaGeneracion)}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Arrendador</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre</Text>
            <Text style={styles.value}>{data.arrendadorNombre}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Correo</Text>
            <Text style={styles.value}>{data.arrendadorEmail}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Arrendatario</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre</Text>
            <Text style={styles.value}>{data.arrendatarioNombre}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Correo</Text>
            <Text style={styles.value}>{data.arrendatarioEmail}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inmueble y contrato</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Inmueble</Text>
            <Text style={styles.value}>{data.inmuebleTitulo}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Dirección</Text>
            <Text style={styles.value}>{data.inmuebleDireccion}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Contrato</Text>
            <Text style={styles.value}>{data.contratoCode}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalle del pago</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Periodo pagado</Text>
            <Text style={styles.value}>{soporte.periodo}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Valor pagado</Text>
            <Text style={styles.value}>{formatCurrency(soporte.monto)}</Text>
          </View>
          {soporte.medioPago ? (
            <View style={styles.row}>
              <Text style={styles.label}>Medio de pago</Text>
              <Text style={styles.value}>{soporte.medioPago}</Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Text style={styles.label}>Fecha reportada</Text>
            <Text style={styles.value}>{formatDate(data.fechaReporte)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha validada</Text>
            <Text style={styles.value}>{formatDate(data.fechaValidacion)}</Text>
          </View>
          {soporte.observaciones ? (
            <View style={styles.row}>
              <Text style={styles.label}>Observaciones</Text>
              <Text style={styles.value}>{soporte.observaciones}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.cert}>
          Este documento certifica que el pago fue validado por el arrendador dentro
          del sistema.
        </Text>

        <View style={styles.footer}>
          <Text>Documento generado automáticamente por el prototipo académico.</Text>
          <Text>AlquilaBogotá — MVP de gestión de arrendamientos</Text>
        </View>
      </Page>
    </Document>
  );
}

"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { NoRenovacionPdfData } from "@/types/no-renovacion-pdf";
import { formatDate } from "@/lib/utils";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 16, marginBottom: 8, fontWeight: "bold", textAlign: "center" },
  subtitle: { fontSize: 10, color: "#555", marginBottom: 16, textAlign: "center" },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: "bold", marginBottom: 4 },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { width: 130, color: "#444", fontSize: 10 },
  value: { flex: 1, fontSize: 10 },
  body: { fontSize: 10, lineHeight: 1.45, marginTop: 8, marginBottom: 12 },
  warning: {
    marginTop: 12,
    padding: 8,
    backgroundColor: "#f5f5f5",
    fontSize: 9,
    fontStyle: "italic",
  },
  firma: { marginTop: 40, fontSize: 10 },
  lineaFirma: {
    marginTop: 36,
    borderTopWidth: 1,
    borderTopColor: "#333",
    width: 200,
    paddingTop: 4,
  },
});

export function NoRenovacionPdfDocument({ data }: { data: NoRenovacionPdfData }) {
  const { expediente: e } = data;
  const fechaCarta = e.fechaGeneracionDocumento?.slice(0, 10) ?? e.fechaCreacion;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>
          Comunicación de no renovación de contrato de arrendamiento
        </Text>
        <Text style={styles.subtitle}>
          Expediente {e.code} · Contrato {data.codigoContrato}
        </Text>

        <Text style={{ fontSize: 10, marginBottom: 12 }}>
          {data.ciudad}, {formatDate(fechaCarta)}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Remitente</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre</Text>
            <Text style={styles.value}>{e.remitenteNombre}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Documento</Text>
            <Text style={styles.value}>
              {e.remitenteTipoDocumento} {e.remitenteNumeroDocumento}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Correo autorizado</Text>
            <Text style={styles.value}>{e.remitenteEmail}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destinatario</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre</Text>
            <Text style={styles.value}>{e.destinatarioNombre}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Documento</Text>
            <Text style={styles.value}>
              {e.destinatarioTipoDocumento} {e.destinatarioNumeroDocumento}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Correo autorizado</Text>
            <Text style={styles.value}>{e.destinatarioEmail}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contrato e inmueble</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Código contrato</Text>
            <Text style={styles.value}>{data.codigoContrato}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Inmueble</Text>
            <Text style={styles.value}>{data.inmuebleDireccion}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fin de contrato</Text>
            <Text style={styles.value}>{formatDate(e.fechaFinContrato)}</Text>
          </View>
          {e.fechaLimitePreaviso ? (
            <View style={styles.row}>
              <Text style={styles.label}>Límite preaviso</Text>
              <Text style={styles.value}>{formatDate(e.fechaLimitePreaviso)}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Cuerpo de la comunicación</Text>
        <Text style={styles.body}>
          {(e.cuerpoComunicacionGenerado ?? "").split("\n").join("\n")}
        </Text>

        <Text style={styles.warning}>
          Se recomienda conservar soporte de envío por correo certificado o medio formal
          pactado en el contrato.
        </Text>

        <View style={styles.firma}>
          <View style={styles.lineaFirma}>
            <Text>{e.remitenteNombre}</Text>
            <Text>
              {e.remitenteTipoDocumento} {e.remitenteNumeroDocumento}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

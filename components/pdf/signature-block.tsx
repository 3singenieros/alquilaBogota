"use client";

import { Text, View, StyleSheet } from "@react-pdf/renderer";
import type { FirmaReporte } from "@/types/reportes";

const styles = StyleSheet.create({
  block: { marginTop: 24, flexDirection: "row", justifyContent: "space-between" },
  col: { width: "45%" },
  label: { fontSize: 9, fontWeight: "bold", marginBottom: 4 },
  line: {
    borderTopWidth: 1,
    borderTopColor: "#333",
    marginTop: 36,
    paddingTop: 4,
    fontSize: 9,
  },
  doc: { fontSize: 8, color: "#555" },
});

export function SignatureBlockPdf({ firmas }: { firmas: FirmaReporte[] }) {
  if (firmas.length === 0) return null;
  return (
    <View style={styles.block}>
      {firmas.map((f, i) => (
        <View key={i} style={styles.col}>
          <Text style={styles.label}>
            Firma {f.rol === "GENERADOR" ? "quien genera" : f.rol.toLowerCase()}
          </Text>
          <View style={styles.line}>
            <Text>{f.nombre}</Text>
            {f.tipoDocumento && f.numeroDocumento ? (
              <Text style={styles.doc}>
                {f.tipoDocumento} {f.numeroDocumento}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

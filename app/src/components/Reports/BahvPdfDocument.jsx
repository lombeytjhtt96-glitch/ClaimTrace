import React from 'react';
import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#0f172a',
    lineHeight: 1.5,
  },
  headerBar: {
    borderBottomWidth: 2,
    borderBottomColor: '#00733B',
    paddingBottom: 10,
    marginBottom: 16,
  },
  orgTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00733B',
  },
  subTitle: {
    fontSize: 9,
    color: '#475569',
    marginTop: 2,
  },
  docTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  docNumber: {
    fontSize: 9,
    textAlign: 'center',
    color: '#334155',
    marginBottom: 14,
  },
  section: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0C4A60',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  label: {
    color: '#475569',
    width: '38%',
  },
  value: {
    fontWeight: 'bold',
    width: '62%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#00733B',
    color: '#ffffff',
    padding: 6,
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 6,
    fontSize: 8.5,
  },
  colId: { width: '22%' },
  colFaskes: { width: '30%' },
  colCbg: { width: '16%' },
  colStatus: { width: '16%' },
  colAmount: { width: '16%', textAlign: 'right' },
  footer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    paddingTop: 8,
    fontSize: 8,
    color: '#64748b',
  },
});

const formatRp = (val) => {
  const num = Number(val || 0);
  return `Rp ${num.toLocaleString('id-ID')}`;
};

export function BahvPdfDocument({
  documentNumber = 'BAHV/BPJS/XI/2026/001',
  fpkNumber = 'FPK-0114-202611-001',
  hospitalName = 'RS Khusus Mitra Husada',
  directorName = 'dr. Wahyu Hidayat, Sp.B, MARS',
  verifierName = 'Administrator ClaimTrace (NIP 198801012026011001)',
  generatedAt = '18 November 2026 WIB',
  sha256Hash = 'VERIFIED-SHA256-AUDIT-LEDGER',
  items = [],
}) {
  return (
    <Document
      title={`BAHV ClaimTrace JKN - ${documentNumber}`}
      author="BPJS Kesehatan · ClaimTrace DSS"
      subject="Berita Acara Hasil Verifikasi Klaim FKRTL"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBar}>
          <Text style={styles.orgTitle}>BPJS KESEHATAN · CLAIMTRACE JKN DSS</Text>
          <Text style={styles.subTitle}>
            Kedeputian Bidang Pengawasan dan Pemeriksaan · Penapisan Multi-Sinyal 4-Lapis (UU PDP No. 27/2022)
          </Text>
        </View>

        <Text style={styles.docTitle}>Berita Acara Hasil Verifikasi (BAHV) Klaim FKRTL</Text>
        <Text style={styles.docNumber}>Nomor: {documentNumber} · FPK: {fpkNumber}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Identitas Fasilitas Kesehatan & Penanggung Jawab</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nama FKRTL</Text>
            <Text style={styles.value}>{hospitalName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Direktur / Pimpinan FKRTL</Text>
            <Text style={styles.value}>{directorName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Verifikator BPJS Kesehatan</Text>
            <Text style={styles.value}>{verifierName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Waktu Penerbitan</Text>
            <Text style={styles.value}>{generatedAt}</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.colId}>Kode Klaim</Text>
          <Text style={styles.colFaskes}>Faskes / Layanan</Text>
          <Text style={styles.colCbg}>INA-CBG</Text>
          <Text style={styles.colStatus}>Status</Text>
          <Text style={styles.colAmount}>Nilai Klaim</Text>
        </View>

        {(items.length > 0
          ? items
          : [
              {
                claim_id: 'CLM-2026-8801',
                nama_faskes: hospitalName,
                ina_cbg_code: 'Z-3-12-0',
                status_verifikasi: 'TIDAK_LAYAK_FRAUD',
                nilai_klaim_rp: 15300000,
              },
            ]
        ).map((item, idx) => (
          <View key={item.claim_id || idx} style={styles.tableRow}>
            <Text style={styles.colId}>{item.claim_id}</Text>
            <Text style={styles.colFaskes}>{item.nama_faskes || hospitalName}</Text>
            <Text style={styles.colCbg}>{item.ina_cbg_code || '-'}</Text>
            <Text style={styles.colStatus}>{item.status_verifikasi || 'TERVERIFIKASI'}</Text>
            <Text style={styles.colAmount}>{formatRp(item.nilai_klaim_rp)}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text>Jejak Integritas Kriptografis SHA-256: {sha256Hash}</Text>
          <Text>Dokumen PDF vektor ini dihasilkan secara lokal oleh React-PDF (@react-pdf/renderer) tanpa eksfiltrasi data PHI ke cloud eksternal.</Text>
        </View>
      </Page>
    </Document>
  );
}

/**
 * Generates and triggers browser download of an official BAHV vector PDF via @react-pdf/renderer.
 */
export async function downloadBahvPdf(reportProps = {}, filename = 'BAHV_ClaimTrace_JKN.pdf') {
  const blob = await pdf(<BahvPdfDocument {...reportProps} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  return blob;
}

export default BahvPdfDocument;

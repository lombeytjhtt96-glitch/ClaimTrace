# ADR-0005: Pemisahan Vendor Chunk Frontend dan Optimasi Core Web Vitals

## Status
Accepted

## Konteks
Pemeriksaan build awal pada bundler frontend menunjukkan peringatan ukuran chunk monolitik yang melampaui batas standar browser modern: `dist/assets/index.js` mencapai 2.28 MB (568 kB gzipped). Ketergantungan berat seperti pustaka visualisasi grafik (@xyflow/react, recharts/d3) dan ikonografi (lucide-react) tergabung ke dalam bundle inisial utama. Kondisi ini memperlambat Largest Contentful Paint (LCP) dan Interaction to Next Paint (INP) pada portal operasional verifikator klaim, khususnya saat diakses melalui jaringan faskes perifer.

## Keputusan
Menerapkan strategi pemecahan chunk deterministik (*manual vendor chunking*) pada konfigurasi Vite (`app/vite.config.js`) berdasarkan isolasi ranah fungsional:
1. **charts (`vendor-charts`)**: Mengisolasi pustaka Recharts dan D3 untuk modul grafik analitik klaim dan tren anomali.
2. **flow (`vendor-flow`)**: Mengisolasi engine alur interaktif Node Graph (@xyflow/react) untuk diagram investigasi jejak klaim.
3. **icons (`vendor-icons`)**: Mengisolasi pustaka Lucide React agar tree-shaking simbol ikonik beroperasi optimal.
4. **core bundle (`index`)**: Menjaga runtime esensial (React, DOM, Tailwind) tetap ringkas untuk mempercepat waktu render perdana.

## Konsekuensi
- **Positif**: Ukuran bundel inisial tereduksi sebesar 35%+ (dari 2.28 MB menjadi 1.47 MB; 331 kB gzipped). Eliminasi dependensi sirkular antar-chunk vendor, mempercepat inisialisasi modul landing page dan dashboard triage, serta mematuhi rekomendasi standar *agent-skills* (performance-optimization dan web-performance-auditor).
- **Negatif**: Memerlukan konfigurasi *chunkSizeWarningLimit* terkalibrasi dan pengujian integritas eksekusi build berkala saat penambahan dependensi visualisasi baru.

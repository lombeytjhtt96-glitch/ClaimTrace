# PANDUAN PENYEBARAN & LINGKUNGAN OPERASIONAL (DEPLOYMENT GUIDE)
## CLAIMTRACE JKN DSS — SISTEM PENGAWASAN KLAIM PRA-BAYAR BPJS KESEHATAN
### Lingkungan Produksi Lokal & Opsi Penyebaran Awan

Dokumen ini memandu pengoperasian aplikasi **ClaimTrace JKN** secara menyeluruh baik di lingkungan lokal (Localhost Production-Grade) maupun opsi penyebaran awan (*cloud deployment*).

---

## 1. STRUKTUR LINGKUNGAN SISTEM

```
claimtrace-jkn/
├── docker-compose.yml    # Orkestrasi Docker multi-container (Frontend & Backend)
├── start_all.sh          # Skrip peluncuran otomatis Linux / WSL
├── start_all.bat         # Skrip peluncuran otomatis Windows Command Prompt
├── app/                  # Frontend Web SPA Cockpit (React 18 + Vite + TailwindCSS)
│   ├── Dockerfile        # Container Nginx multi-stage untuk Frontend
│   ├── package.json      # Dependensi Node.js & antarmuka
│   └── src/              # Komponen Dashboard, Dual Cockpit, Decision Console
├── backend/              # Backend API & AI Engine (FastAPI + Python 3.11+)
│   ├── Dockerfile        # Container Python untuk Backend API
│   ├── requirements.txt  # Dependensi Python analitik & pengujian
│   └── app/              # Mesin Triase, Audit SHA-256, FHIR Adapter, SLA Engine
└── docs/                 # Dokumentasi spesifikasi & rancangan sistem
```

---

## 2. PENGOPERASIAN UTAMA: LINGKUNGAN LOKAL (LOCALHOST PRODUCTION)

### Menjalankan Seluruh Ekosistem Secara Bersamaan (Rekomendasi Cepat)

Di lingkungan Linux atau WSL:
```bash
./start_all.sh
```

Di lingkungan Windows:
```cmd
start_all.bat
```

### Menjalankan Layanan Secara Terpisah

1. **Backend API (FastAPI pada Port 8000)**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   - Layanan API: `http://localhost:8000`
   - Dokumentasi Interaktif Swagger UI: `http://localhost:8000/docs`
   - Health Check: `http://localhost:8000/api/v1/health`

2. **Frontend Web Cockpit (Vite pada Port 3000)**:
   ```bash
   cd app
   npm install
   npm run dev -- --host 0.0.0.0 --port 3000
   ```
   - Akses Cockpit: `http://localhost:3000`
   - Akun Verifikator Default: `verifikator.bpjs@jkn.go.id` / `demo123`

---

## 3. PENGUJIAN KUALITAS OTOMATIS (TESTING & VERIFIKASI)

### Uji Backend Otomatis (113 Test Suite)
```bash
python3 -m pytest backend/tests/ -v
```
Seluruh 113 pengujian mencakup:
- Formula fusi risiko dan *hard triggers* pelanggaran fatal
- Rantai integritas audit kriptografis SHA-256 anti-tamper
- Deteksi anomali *phantom billing*, *repeat billing*, dan *upcoding*
- Kalkulasi hari kerja murni (SLA 10 hari kerja Perpres 82/2018)
- Keamanan otorisasi RBAC Internet2 Grouper & sanitasi Zero-PHI UU PDP

### Verifikasi Kompilasi Frontend
```bash
cd app
npm run build
```
Memastikan tidak ada eror kompilasi, tipe data, atau dependensi pada bundel produksi.

---

## 4. OPSI PENYEBARAN DOCKER CONTAINER

Untuk menjalankan sistem dalam kontainer Docker terisolasi:
```bash
docker compose up --build -d
```
Layanan akan aktif di:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

Untuk menghentikan kontainer:
```bash
docker compose down
```

---

## 5. OPSI DEMO JARAK JAUH: CLOUDFLARE TUNNEL (INSTAN UNTUK JURI / MENTOR)

Jika Anda ingin menampilkan aplikasi langsung dari laptop kepada mentor atau dewan juri tanpa perlu konfigurasi server awan:

1. Jalankan layanan lokal Anda (`./start_all.sh`).
2. Di terminal baru, jalankan terowongan aman instan:
   ```bash
   npx untun@latest tunnel http://localhost:3000
   ```
3. Salin URL publik `https://*.trycloudflare.com` yang muncul di layar dan bagikan kepada mentor untuk demonstrasi real-time.

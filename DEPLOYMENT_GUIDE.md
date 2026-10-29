# PANDUAN LENGKAP PENYEBARAN (DEPLOYMENT GUIDE)
## CLAIMTRACE JKN DSS — SISTEM PENGAWASAN KLAIM PRA-BAYAR BPJS KESEHATAN

Dokumen ini memandu proses pendeploy-an aplikasi **ClaimTrace JKN** secara menyeluruh, mulai dari demonstrasi lokal (on-premise), kontainerisasi Docker, hingga hosting cloud publik gratis/produksi (Vercel + Render / Railway / Cloudflare Tunnel).

---

## 1. STRUKTUR LINGKUNGAN APLIKASI

```
claimtrace-jkn/
├── app/                  # Frontend Web SPA (React 18 + Vite + TailwindCSS + Lucide + Recharts + XYFlow)
│   ├── Dockerfile        # Multi-stage production container (Node 20 build -> Nginx alpine)
│   ├── nginx.conf        # Nginx reverse proxy & SPA history routing
│   └── .env.example      # Template variabel lingkungan frontend (VITE_API_BASE_URL)
├── backend/              # Backend API & AI Engine (FastAPI + Uvicorn + Google Gemini Live API)
│   ├── Dockerfile        # Container Python 3.11-slim
│   ├── requirements.txt  # Dependensi Python
│   └── .env.example      # Template variabel lingkungan backend (GEMINI_API_KEY)
└── docker-compose.yml    # Orkestrasi multi-container (Frontend: 3000, Backend: 8000)
```

---

## 2. PILIHAN A: INSTANT PUBLIC LIVE URL VIA CLOUDFLARE TUNNEL (GRATIS & TERCEPAT)

Opsi ini sangat direkomendasikan untuk **presentasi juri / panitia HealthKathon** tanpa perlu migrasi database atau konfigurasi cloud yang rumit:

1. Pastikan backend dan frontend sedang berjalan di mesin lokal:
   ```bash
   # Terminal 1: Backend
   cd backend
   python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

   # Terminal 2: Frontend
   cd app
   npm run dev -- --host 0.0.0.0 --port 3000
   ```

2. Jalankan Cloudflare Tunnel (tanpa registrasi kartu kredit):
   ```bash
   # Menggunakan npx atau cloudflared binary
   npx untun@latest tunnel http://localhost:3000
   # ATAU jika menggunakan cloudflared:
   cloudflared tunnel --url http://localhost:3000
   ```
3. Salin URL publik berakhiran `*.trycloudflare.com` yang dihasilkan dan bagikan langsung ke penguji/juri.

---

## 3. PILIHAN B: DOCKER & DOCKER COMPOSE (PRODUKSI ON-PREMISE / SERVER VPS)

Cocok untuk deployment di server virtual (VPS Linux / Ubuntu / Debian / WSL):

### Langkah-langkah:
1. Pastikan file `.env` di direktori `backend/` sudah memuat `GEMINI_API_KEY`:
   ```bash
   cp backend/.env.example backend/.env
   # Masukkan API Key Google AI Studio Anda
   ```
2. Jalankan Docker Compose:
   ```bash
   docker compose up --build -d
   ```
3. Verifikasi status kontainer:
   ```bash
   docker compose ps
   ```
4. Akses sistem melalui browser:
   - **Frontend Cockpit**: `http://localhost:3000`
   - **Backend API & Swagger**: `http://localhost:8000/docs`
   - **Healthcheck**: `http://localhost:8000/health`

---

## 4. PILIHAN C: CLOUD DEPLOYMENT (VERCEL + RENDER / RAILWAY)

### Bagian 1: Deploy Backend di Render.com (Gratis)
1. Buat akun atau login di [Render.com](https://render.com).
2. Anda memiliki 2 cara mudah:
   - **Cara Otomatis (Blueprint)**: Klik **New +** -> **Blueprint** -> Pilih repo `ClaimTrace`. Render akan otomatis membaca file `render.yaml` yang sudah kami sediakan!
   - **Cara Manual (Web Service)**: Klik **New +** -> **Web Service** -> Pilih repo `ClaimTrace`:
     - **Name**: `claimtrace-backend`
     - **Root Directory**: `backend`
     - **Runtime**: `Python 3`
     - **Region**: `Singapore (Southeast Asia)` *(Paling cepat & rendah latensi untuk Indonesia)*
     - **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
     - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
     - **Plan Type**: `Free`
3. Tambahkan **Environment Variables** di tab *Environment*:
   - `GEMINI_API_KEY` = `YOUR_GEMINI_API_KEY` *(Gunakan Google AI Studio API Key Anda)*
   - `APP_ENV` = `production`
   - `DEBUG` = `false`
4. Klik **Create Web Service** (atau **Apply** pada Blueprint).
5. Tunggu proses build selesai (~2-3 menit). Setelah status menjadi **Live**, salin URL publik backend Anda (contoh: `https://claimtrace-backend.onrender.com`).
6. Tes endpoint kesehatan di browser: `https://claimtrace-backend.onrender.com/api/v1/health` (harus menampilkan status `"healthy"`).

---

### Bagian 2: Deploy Frontend di Vercel (Gratis)
1. Buat akun atau login di [Vercel](https://vercel.com) menggunakan akun GitHub Anda.
2. Klik **Add New...** -> **Project**.
3. Cari dan impor repositori `ClaimTrace`.
4. Pada form konfigurasi:
   - **Framework Preset**: `Vite` *(Otomatis terdeteksi)*
   - **Root Directory**: Klik tombol **Edit** lalu pilih folder `app`
   - **Build Command**: `npm run build` *(Default)*
   - **Output Directory**: `dist` *(Default)*
5. Tambahkan **Environment Variable**:
   - Key: `VITE_API_BASE_URL`
   - Value: `https://claimtrace-backend.onrender.com` *(Gunakan URL backend yang Anda dapatkan dari Render di Bagian 1)*
6. Klik tombol biru **Deploy**.
7. Dalam waktu ~1 menit, situs web frontend Anda akan online dan dapat diakses dari seluruh dunia (misalnya: `https://claimtrace-jkn.vercel.app`).

---

## 5. VERIFIKASI AKHIR SETELAH PENYEBARAN

Setelah sistem berhasil di-deploy, uji ketiga fungsi inti berikut:
1. **Otentikasi SSO Verifikator**:
   - Login dengan NIP `199208152015031002`, Password apa saja, dan masukkan Captcha.
2. **Kueri Chat Forensik Real-Time Google Gemini**:
   - Buka menu **HealthAI** / Asisten Audit JKN.
   - Ketik pertanyaan bebas: *"Apa itu ClaimTrace?"* atau *"Jelaskan anomali klaster fisioterapi Mitra Husada"*.
   - Amati respons dinamis bebas-skrip yang langsung dipikirkan secara cerdas oleh model Google Gemini.
3. **Simulasi Presensi Mobile JKN (Lapis 3)**:
   - Buka tampilan Dual View / Mobile JKN di sisi kiri.
   - Klik tombol konfirmasi presensi dan pastikan skor risiko di konsol verifikator bereaksi secara instan.

# PANDUAN LENGKAP PENYEBARAN (DEPLOYMENT GUIDE)
## CLAIMTRACE JKN DSS — SISTEM PENGAWASAN KLAIM PRA-BAYAR BPJS KESEHATAN
### 100% GRATIS & TANPA KARTU KREDIT (ZERO CREDIT CARD)

Dokumen ini memandu pendeploy-an aplikasi **ClaimTrace JKN** secara menyeluruh tanpa membutuhkan kartu kredit/debit apa pun:
1. **Frontend**: Di-deploy ke **Vercel** (Gratis, tanpa kartu kredit via akun GitHub).
2. **Backend**: Di-deploy ke **Hugging Face Spaces** (Gratis, tanpa kartu kredit, kapasitas 2 vCPU + 16 GB RAM).
3. **Opsi Demo Instan**: **Cloudflare Tunnel** (Langsung online dari laptop dalam 10 detik tanpa daftar apa pun).

---

## 1. STRUKTUR LINGKUNGAN DEPLOYMENT

```
claimtrace-jkn/
├── Dockerfile            # Container untuk Hugging Face Spaces (Port 7860, 2 vCPU, 16GB RAM)
├── vercel.json           # Konfigurasi Vercel SPA routing
├── app/                  # Frontend Web SPA (React 18 + Vite + TailwindCSS)
│   ├── vercel.json       # Konfigurasi SPA rewrite untuk Vercel
│   └── .env.example      # Template VITE_API_BASE_URL
├── backend/              # Backend API & AI Engine (FastAPI + Python 3.11 + Google Gemini)
│   ├── requirements.txt  # Dependensi Python
│   └── .env.example      # Template GEMINI_API_KEY
└── docker-compose.yml    # Konfigurasi Docker lokal
```

---

## 2. PILIHAN UTAMA: CLOUD DEPLOYMENT GRATIS (VERCEL + HUGGING FACE SPACES)

### Bagian 1: Deploy Backend ke Hugging Face Spaces (0 Kartu Kredit)
*Hugging Face Spaces adalah platform cloud kecerdasan buatan terbesar yang menyediakan hosting Docker 100% gratis dengan 16 GB RAM tanpa meminta kartu kredit.*

1. Buka dan login ke **[huggingface.co](https://huggingface.co)** (cukup login menggunakan akun **GitHub** Anda).
2. Di pojok kanan atas, klik foto profil Anda -> pilih **New Space** (atau buka [huggingface.co/new-space](https://huggingface.co/new-space)).
3. Isi form pembuatan Space:
   - **Space name**: `claimtrace-backend`
   - **License**: `mit` (atau `apache-2.0`)
   - **Select the Space SDK**: Pilih **Gradio**
   - **Choose a Gradio template**: Pilih **Blank**
   - **Space hardware**: Pilih **ZeroGPU Free** atau **CPU basic Free**
   - **Visibility**: Pilih **Public**.
4. Klik tombol **Create Space**.
5. Masuk ke tab **Settings** di halaman Space Anda:
   - Scroll ke bagian **Variables and secrets**.
   - Klik **New secret**:
     - **Name**: `GEMINI_API_KEY`
     - **Value**: Masukkan API Key Google AI Studio Anda.
     - Klik **Save**.
6. Hubungkan ke repositori GitHub:
   - Di tab Space Anda, Anda bisa menyinkronkan repositori GitHub `lombeytjhtt96-glitch/ClaimTrace`, ATAU push langsung ke git remote Hugging Face yang disediakan di halaman Space:
     ```bash
     git remote add space https://huggingface.co/spaces/<USERNAME_ANDA>/claimtrace-backend
     git push space main
     ```
7. Tunggu build Docker selesai (~2 menit). Status akan berubah menjadi **Running** warna hijau!
8. Salin URL publik Space Anda:
   - Format URL: `https://<USERNAME_ANDA>-claimtrace-backend.hf.space`
   - Tes di browser: `https://<USERNAME_ANDA>-claimtrace-backend.hf.space/api/v1/health` (akan merespons status `"healthy"`).

---

### Bagian 2: Deploy Frontend ke Vercel (0 Kartu Kredit)
*Vercel paket Hobby 100% gratis dan tidak meminta kartu kredit saat mendaftar dengan GitHub.*

1. Buka dan login ke **[vercel.com](https://vercel.com)** menggunakan akun **GitHub** Anda.
2. Di dashboard Vercel, klik **Add New...** -> pilih **Project**.
3. Cari dan klik tombol **Import** pada repositori **`ClaimTrace`** (`lombeytjhtt96-glitch/ClaimTrace`).
4. Pada halaman *Configure Project*:
   - **Framework Preset**: Terdeteksi otomatis sebagai **Vite**.
   - **Root Directory**: Klik tombol **Edit**, pilih folder **`app`**, lalu klik **Continue**.
5. Buka bagian **Environment Variables** (klik tanda panah ke bawah):
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: Masukkan URL Hugging Face Spaces Anda (contoh: `https://<USERNAME_ANDA>-claimtrace-backend.hf.space` — *tanpa tanda garis miring di akhir*).
6. Klik tombol **Deploy**.
7. Dalam ~1 menit, website Anda sudah aktif online di seluruh dunia melalui domain Vercel (misalnya: `https://claimtrace-jkn.vercel.app`).

---

## 3. PILIHAN ALTERNATIF TERCEPAT: CLOUDFLARE TUNNEL (INSTAN UNTUK DEMO JURI)

Jika Anda ingin menampilkan aplikasi langsung kepada panitia/juri saat presentasi atau perekaman video demo tanpa perlu setup cloud:

1. Jalankan backend dan frontend di mesin lokal Anda:
   ```bash
   # Terminal 1: Backend
   cd backend && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

   # Terminal 2: Frontend
   cd app && npm run dev -- --host 0.0.0.0 --port 3000
   ```
2. Jalankan perintah Cloudflare Tunnel di terminal baru (tanpa kartu kredit, tanpa registrasi akun):
   ```bash
   npx untun@latest tunnel http://localhost:3000
   ```
3. Salin URL publik `https://*.trycloudflare.com` yang muncul di layar dan berikan kepada siapa saja untuk mengakses aplikasi secara live.

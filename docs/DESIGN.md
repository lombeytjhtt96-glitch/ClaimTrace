# DESIGN SYSTEM SPECIFICATION (DESIGN.md)
## Project: ClaimTrace Enterprise Verificator Suite & JKN Companion
> **Catatan Penyelarasan Canonical (`Clinical Precision`):** Spesifikasi token visual utama yang berlaku pada versi produksi final tercantum pada [`DESIGN.md`](../DESIGN.md) di root repositori (Mode Terang *Clinical Precision* `#F7F8FA` / `#FFFFFF` / `#061B31` sebagai default mutlak seluruh halaman Autentikasi & Dasbor Utama, dengan aksen Clinical Emerald `#047857` dan header institusional `#00134A`). Dokumen `docs/DESIGN.md` ini dipertahankan sebagai arsip referensi varian **Enterprise Dark Theme** pada area cockpit operasional yang mendukung toggle tema.

**Target Platform:** Web Desktop (1920x1080 / 1440x900) & Mobile JKN Viewport (390x844)  
**Design Philosophy:** "Evidence-First, Zero Alert-Fatigue, High Information Density"  
**Tooling Compatibility:** ClaimTrace UI Tokens, Tailwind CSS v3/v4  

---

## 1. Visual Identity & Brand Foundations

ClaimTrace mengadopsi standar visual resmi **BPJS Kesehatan**, dipadukan dengan estetika *Enterprise Command Center* yang dirancang khusus untuk verifikator yang bekerja meneliti ratusan klaim per hari agar tidak mengalami kelelahan visual (*eye fatigue*).

### 1.1. Color Tokens (Hex & HSL)

#### Brand & Core Accents
| Token Name | Hex Code | HSL | Peruntukan & Makna Semantik |
| :--- | :---: | :---: | :--- |
| `color-bpjs-green` | `#01A65A` | `153°, 99%, 33%` | Warna resmi identitas BPJS Kesehatan, kartu KIS digital, tombol aksi positif. |
| `color-bpjs-darkgreen` | `#008D4C` | `152°, 100%, 28%` | State hover elemen hijau, header gradasi awal. |
| `color-bpjs-blue` | `#0288D1` | `201°, 98%, 42%` | Warna sekunder BPJS, status telemedisin, aksen navigasi. |
| `color-bpjs-navy` | `#0C4A60` | `195°, 78%, 21%` | Sidebar enterprise, header background kontras. |

#### Semantic Triage Colors (The Three Tiers of Risk)
| Token Name | Hex Code | Deskripsi & Indikator UI |
| :--- | :---: | :--- |
| `triage-green-surface` | `#064E3B` | Latar belakang chip status Triage Hijau (Fast-Track Wajar). |
| `triage-green-text` | `#34D399` | Teks dan icon skor $S < 50$. |
| `triage-yellow-surface`| `#78350F` | Latar belakang chip status Triage Kuning (Klarifikasi Data). |
| `triage-yellow-text` | `#FBBF24` | Teks dan icon skor $50 \le S < 75$. |
| `triage-red-surface` | `#881337` | Latar belakang chip status Triage Merah (Prioritas Telaah Pra-Bayar). |
| `triage-red-text` | `#FB7185` | Teks, icon, dan border skor $S \ge 75$ atau Hard Trigger. |

#### Neutral & Background Palette (Enterprise Dark Theme)
| Token Name | Hex Code | Penggunaan |
| :--- | :---: | :--- |
| `bg-slate-950` | `#020617` | Latar belakang utama workspace dashboard web. |
| `bg-slate-900` | `#0F172A` | Background kartu utama (*card surface*), sidebar, top bar. |
| `bg-slate-800` | `#1E293B` | Background elemen bersarang (*nested cards*), border sekunder. |
| `border-slate-800` | `#1E293B` | Garis batas pemisah kolom, tabel antrean klaim. |
| `text-slate-100` | `#F1F5F9` | Teks judul utama, nominal angka klaim, skor numerik. |
| `text-slate-400` | `#94A3B8` | Teks label pendukung, subjudul, keterangan waktu. |

---

## 2. Typography System

Mengikuti temuan reverse engineering resmi dari paket APK Mobile JKN `v4.18.0`, font keluarga utama adalah **Montserrat**, dikombinasikan dengan font monospace untuk data numerik & hash audit.

- **Primary Font Family:** `'Montserrat', sans-serif` (Semua judul, navigasi, dan tombol).
- **Secondary Body Font:** `'Inter', sans-serif` (Paragraf analisis berkas dan tabel data).
- **Monospace Font:** `'JetBrains Mono', 'Fira Code', monospace` (Nomor Kartu KIS, NIK, Kode ICD-10/ICD-9-CM, SHA-256 Hash).

### Type Scale Matrix
| Level | Ukuran | Weight | Line Height | Contoh Penggunaan |
| :--- | :---: | :---: | :---: | :--- |
| `Display 1` | 24px (1.5rem) | 900 (Black) | 32px | Angka Fusi Skor Prioritas ($87.0/100$) |
| `Heading 1` | 20px (1.25rem) | 800 (ExtraBold) | 28px | Judul Layar ("ClaimTrace Evidence-First Triage") |
| `Heading 2` | 16px (1.0rem) | 700 (Bold) | 24px | Nama Faskes ("RS Khusus Mitra Husada") |
| `Subheading` | 13px (0.8125rem) | 600 (SemiBold) | 18px | Label Lapis Bukti ("Lapis 1: Radar Pola") |
| `Body Standard`| 12px (0.75rem) | 500 (Medium) | 16px | Teks penjelasan klaim, rincian tindakan medis |
| `Caption / Tag`| 10px (0.625rem) | 700 (Bold) | 14px | Chip badge triage, SLA counter, kode INA-CBG |

---

## 3. Layout Grid & Workspace Structure

### 3.1. Dual-View Presentation Ratio (Split-Sync Mode)
Pada layar desktop (1920×1080), antarmuka terbagi menjadi 2 viewport yang tersinkronisasi:
- **Left Column (40% - 5/12 Grid):** Smartphone Frame Simulator Mobile JKN (Lebar tetap: 390px, Tinggi: 810px, border melengkung `rounded-[48px]`, bayangan `shadow-2xl`).
- **Right Column (60% - 7/12 Grid):** Enterprise Verificator Dashboard (Lebar fleksibel, multi-panel dengan 3 kartu matriks bukti dan console keputusan verifikator).

### 3.2. Responsive Breakpoint Behavior
- `Desktop (>= 1280px)`: Tampilan split side-by-side aktif penuh dengan live reactive websocket visualizer.
- `Tablet / Single Focus (1024px)`: Tab switcher otomatis mengaktifkan toggle cepat antar tampilan.
- `Mobile (< 768px)`: Menampilkan smartphone view dengan drawer geser untuk melihat dashboard.

---

## 4. Component Library Architecture

### 4.1. Triage Metric Card (KPI Header)
- Bentuk persegi panjang dengan rounded corner 16px (`rounded-2xl`).
- Menampilkan:
  1. Ikon kategori (Hospital, CheckCircle, AlertTriangle, AlertOctagon).
  2. Label kecil (misal: "Jalur Merah (Prioritas Telaah)").
  3. Angka besar berbobot ExtraBold (misal: "85 Klaim").
  4. Persentase perbandingan terhadap total klaim (misal: "2.0%").

### 4.2. Triage Table Row
- Baris tabel dengan padding vertikal nyaman (`py-3.5`).
- Baris berstatus **Merah** memiliki aksen garis samping kiri setebal 4px berwarna Rose-500 (`border-l-4 border-rose-500`).
- Hover state: latar belakang baris bertransisi halus ke `bg-slate-800/80` dengan kursor pointer.

### 4.3. The 3-Layer Evidence Card Matrix (Kartu Matriks 3 Lapis)
Tiga kartu horizontal yang berdampingan:
1. **Kartu Lapis 1 (Radar Pola):**
   - Header: Aksen Emerald/Cyan dengan skor numerik $S_1$.
   - Grafik mini / Sparkline lonjakan volume harian ($8.5\times$ dari baseline).
   - Indikator episode duplicate flag.
2. **Kartu Lapis 2 (Uji Jejak SATUSEHAT SDMK):**
   - Header: Aksen Biru dengan skor numerik $S_2$.
   - Status badge SIP DPJP: Merah kedaluwarsa vs Hijau aktif.
   - Peringatan kapasitas beban dokter harian.
3. **Kartu Lapis 3 (Konfirmasi Peserta Mobile JKN):**
   - Header: Aksen Amber/Rose dengan skor numerik $S_3$.
   - Bar rasio respons: Kotak visual 10 peserta sampel (8 merah menyangkal, 2 hijau mengonfirmasi).
   - Label sinkronisasi live dari aksi di smartphone.

### 4.4. Decision Action Bar (Human-in-the-Loop Console)
- Bar konsol keputusan di bagian bawah panel berkas kasus:
  - Tombol Merah Primer: `[TUNDA: Tunda Berita Acara & Minta Klarifikasi Faskes]`
  - Tombol Kuning Sekunder: `[AUDIT: Jadwalkan Uji Petik Lapangan]`
  - Tombol Abu-abu Netral: `[OVERRIDE: Loloskan Klaim (Override Manual)]`
  - Tombol Ekspor: `[EKSPOR: Unduh Berkas Siap-Audit (PDF Format)]`

---

## 5. UI Rendering & Contrast Directives

Ketika merender komponen antarmuka ClaimTrace:
1. **Ketegasan Visual:** Jangan gunakan warna abu-abu pudar untuk elemen status penting; gunakan kontras tinggi WCAG AAA untuk memastikan angka skor dan chip triage terbaca jelas dalam rekaman video Zoom.
2. **Micro-interactions:** 
   - Tombol keputusan harus memiliki efek feedback riil (glowing ring atau modal konfirmasi stempel SHA-256).
   - Kartu Lapis 3 di dashboard harus bereaksi dengan animasi pulse saat respons dikirim dari ponsel simulator.
3. **Bebas Komponen Placeholder:** Seluruh data teks, nama faskes, kode INA-CBG, dan nama DPJP harus menggunakan data medis realistis dari skenario proposal Healthkathon (bukan teks latin dummy/Lorem Ipsum).

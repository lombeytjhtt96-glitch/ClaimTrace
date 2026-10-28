import React, { useState, useEffect } from 'react';
import { 
  Settings, Check, X, RefreshCw, Eye, EyeOff, CheckCircle2,
  Sun, Moon, Monitor, Palette, Layers, Bot, Smartphone, 
  Shield, Database, Bell, Volume2, Sparkles, Sliders,
  HelpCircle, AlertTriangle, ArrowRight, Lock, Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const INITIAL_SETTINGS_CATEGORIES = [
  {
    id: 'appearance_theme',
    title: 'Tampilan, Tema & Preferensi Antarmuka Pengguna',
    icon: 'Palette',
    description:
      'Sesuaikan gaya visual dasbor sesuai preferensi kerja Anda: pilih antara Tema Gelap (Cosmic Obsidian), Tema Terang (Clinical White BPJS), kepadatan antarmuka, dan aksen warna.',
    settings: [
      {
        key: 'ui_theme_mode',
        label: 'Mode Tema Dasbor (Theme Mode)',
        help_text: 'Tersedia pilihan Tema Gelap (Cosmic Obsidian, Tema Terang (Clinical White resmi faskes BPJS), atau Otomatis mengikuti sistem OS.',
        type: 'theme_selector',
        value: 'dark', // 'dark', 'light', 'system'
        editable: true,
      },
      {
        key: 'ui_density',
        label: 'Kepadatan Antarmuka (Interface Density)',
        help_text: 'Mengatur kerapatan baris tabel, padding modul, dan ukuran elemen audit data.',
        type: 'select',
        options: [
          { value: 'compact', label: 'Kompak (Compact - Maksimal Baris Tabel)' },
          { value: 'standard', label: 'Standar (Default - Keseimbangan Optimal)' },
          { value: 'spacious', label: 'Luas (Spacious - Spasi Lebih Renggang)' },
        ],
        value: 'standard',
        editable: true,
      },
      {
        key: 'ui_accent_color',
        label: 'Aksen Warna Utama (Primary Accent)',
        help_text: 'Warna penekanan elemen aktif, tombol sorotan, dan lencana status prioritas.',
        type: 'select',
        options: [
          { value: 'emerald', label: 'Zamrud Medis (#10B981)' },
          { value: 'gold', label: 'Emas Imperial (#FFCA40)' },
          { value: 'cyan', label: 'Biru Sian (#38BDF8)' },
          { value: 'purple', label: 'Ungu Kedokteran (#8B5CF6)' },
        ],
        value: 'emerald',
        editable: true,
      },
      {
        key: 'ui_glassmorphism',
        label: 'Efek Visual Frosted Glass & Transparansi Blur',
        help_text: 'Aktifkan efek kaca transparan modern. Dapat dimatikan untuk performa maksimal pada laptop spek hemat energi.',
        type: 'toggle',
        value: true,
        editable: true,
      },
      {
        key: 'ui_motion_effects',
        label: 'Animasi Halus & Mikro-Interaksi (Motion Transitions)',
        help_text: 'Jalankan animasi transisi antar halaman dan tab dasbor menggunakan akselerasi GPU.',
        type: 'toggle',
        value: true,
        editable: true,
      },
      {
        key: 'ui_language',
        label: 'Bahasa Sistem & Format Audit',
        help_text: 'Bahasa baku pada modul penapisan, istilah hukum, dan cetakan Berita Acara.',
        type: 'select',
        options: [
          { value: 'id', label: 'Bahasa Indonesia (Resmi BPJS Kesehatan)' },
          { value: 'en', label: 'English (International Audit Format)' },
        ],
        value: 'id',
        editable: true,
      },
      {
        key: 'ui_currency_format',
        label: 'Standar Format Nilai Finansial',
        help_text: 'Format desimal dan simbol mata uang untuk seluruh kalkulasi klaim.',
        type: 'text',
        value: 'IDR (Rp - Rupiah Indonesia, ISO 4217)',
        editable: false,
      },
    ],
  },
  {
    id: 'tri_layer_engine',
    title: 'Mesin Deteksi Anomali Tiga Lapis & Ambang Batas Risiko',
    icon: 'Layers',
    description:
      'Konfigurasikan bobot fusi risiko komposit (Lapis 1 Pola Klinis, Lapis 2 Tata Kelola/SIP, Lapis 3 Presensi Pasien) dan ambang batas penyortiran otomatis.',
    settings: [
      {
        key: 'auto_flag_critical',
        label: 'Tandai Otomatis Klaim Kritis (Jalur Merah / Red Lane)',
        help_text:
          'Arahkan otomatis berkas klaim dengan skor risiko komposit >= Ambang Jalur Merah ke Antrean Audit Pra-Pembayaran.',
        type: 'toggle',
        value: true,
        editable: true,
      },
      {
        key: 'red_lane_threshold',
        label: 'Ambang Batas Skor Risiko Jalur Merah (Red Lane)',
        help_text:
          'Skor komposit minimum Tiga Lapis (0-100) untuk mengklasifikasikan berkas klaim sebagai Risiko Kritis / Tinggi.',
        type: 'number',
        value: 80,
        editable: true,
      },
      {
        key: 'yellow_lane_threshold',
        label: 'Ambang Batas Klarifikasi Jalur Kuning (Yellow Lane)',
        help_text:
          'Skor minimum (0-100) yang mewajibkan konfirmasi resume medis/dokumen penunjang sebelum penerbitan BAKB.',
        type: 'number',
        value: 50,
        editable: true,
      },
      {
        key: 'geovelocity_speed_limit',
        label: 'Toleransi Geovelocity DPJP Maksimal (km/jam)',
        help_text:
          'Batas kecepatan perpindahan logis dokter antar-faskes berbeda untuk mendeteksi penagihan klaim fiktif / joki SIP.',
        type: 'number',
        value: 120,
        editable: true,
      },
      {
        key: 'split_claim_threshold',
        label: 'Ambang Batas Pemecahan Klaim (Unbundling Threshold)',
        help_text:
          'Jumlah maksimum episode rawat jalan dalam 7 hari untuk pasien dan diagnosa sama sebelum ditandai sebagai indikasi pemecahan episode.',
        type: 'number',
        value: 3,
        editable: true,
      },
      {
        key: 'min_claim_value_audit',
        label: 'Batas Minimum Nominal Klaim Ditapis (Rupiah)',
        help_text:
          'Nominal minimum berkas klaim yang wajib melalui inferensi fusi bukti tiga lapis secara komprehensif.',
        type: 'number',
        value: 500000,
        editable: true,
      },
      {
        key: 'geovelocity_check',
        label: 'Validasi Geovelocity DPJP & SIP Waktu-Nyata',
        help_text:
          'Periksa silang keabsahan SIP dokter dan jadwal praktik yang tumpang tindih antar-FKRTL secara otomatis.',
        type: 'toggle',
        value: true,
        editable: true,
      },
      {
        key: 'phantom_billing_detector',
        label: 'Deteksi Anomali Phantom Billing Massal (Lonjakan Baksos)',
        help_text:
          'Deteksi otomatis klaster klaim anomali pasca-kegiatan bakti sosial dan resep obat farmasi tanpa riwayat kehadiran fisik.',
        type: 'toggle',
        value: true,
        editable: true,
      },
      {
        key: 'deep_pnpk_fornas_engine',
        label: 'Audit Mendalam Regulasi PNPK & Fornas KMK 200/2020',
        help_text: 'Mengevaluasi secara otomatis kepatuhan restriksi visus katarak, indikasi albumin human, sepsis neonatal berat, dan ambang admisi ulang 30 hari.',
        type: 'toggle',
        value: true,
        editable: true,
      },
      {
        key: 'fusion_formula',
        label: 'Rumus Fusi Matematis Tiga Lapis',
        help_text: 'Pembobotan aktuaria standar yang diterapkan di seluruh Kantor Cabang BPJS Kesehatan.',
        type: 'text',
        value: 'S_total = 0.50(L1_PolaKlinis) + 0.30(L2_TataKelola) + 0.20(L3_PresensiPeserta)',
        editable: false,
      },
    ],
  },
  {
    id: 'ai_insights_agent',
    title: 'Kecerdasan Buatan (AI), Agen Wawasan (IA) & LLM Guardrails',
    icon: 'Bot',
    description:
      'Kelola orkestrasi model AI, penalaran forensik ReAct, sensor otomatis data pribadi (Zero-PHI Redaction), dan pelaporan otomatis.',
    settings: [
      {
        key: 'llm_powered_insights',
        label: 'Pengenalan Pola Anomali Cerdas Berbasis ClaimTrace AI',
        help_text:
          'Gunakan ClaimTrace AI untuk menyintesis pola upcoding, phantom billing, dan rekomendasi medikolegal audit klaim.',
        type: 'toggle',
        value: true,
        editable: true,
      },
      {
        key: 'llm_model_selection',
        label: 'Pilihan Model Fondasi AI Aktif',
        help_text: 'Model yang digunakan untuk inferensi penalaran dan rekomendasi penapisan risiko.',
        type: 'select',
        options: [
          { value: 'claimtrace-fast', label: 'ClaimTrace Core Engine (Cepat, Efisien, Zero-PHI)' },
          { value: 'claimtrace-pro', label: 'ClaimTrace Reasoning Engine (Penalaran Mendalam Kasus Kompleks)' },
        ],
        value: 'claimtrace-fast',
        editable: true,
      },
      {
        key: 'ai_temperature',
        label: 'Suhu Penalaran Model (Temperature)',
        help_text:
          'Tingkat determinisme respon AI. Nilai rendah (0.1) menjamin rekomendasi hukum yang konsisten dan anti-halusinasi.',
        type: 'number',
        value: 0.1,
        editable: true,
      },
      {
        key: 'zero_phi_sanitizer',
        label: 'Sanitasi Otomatis Data Pribadi Pasien (Zero-PHI Masker)',
        help_text:
          'Hapus NIK, nama lengkap, dan nomor kontak peserta secara kriptografis sebelum teks diajukan ke mesin AI.',
        type: 'toggle',
        value: true,
        editable: true,
      },
      {
        key: 'auto_weekly_ia_report',
        label: 'Pembuatan Laporan Mingguan IA Otomatis',
        help_text: 'Susun laporan ringkasan eksekutif pengawasan klaim setiap hari Senin pukul 06:00 WIB.',
        type: 'toggle',
        value: true,
        editable: true,
      },
      {
        key: 'agent_max_steps',
        label: 'Batas Langkah Penalaran Kopilot Forensik ReAct',
        help_text: 'Jumlah maksimum pemanggilan instrumen audit otomatis per investigasi berkas klaim.',
        type: 'number',
        value: 8,
        editable: true,
      },
      {
        key: 'llm_model_id',
        label: 'Identitas Model Fondasi Aktif',
        help_text: 'Titik akhir LLM terkonfigurasi untuk penalaran forensik Zero-PHI (Tanpa Data Pribadi Mentah).',
        type: 'text',
        value: 'ClaimTrace Engine v2.5 (Enterprise Zero-PHI)',
        editable: false,
      },
      {
        key: 'ai_api_key_vault',
        label: 'Kredensial Model AI (Server-Side Vault)',
        help_text: 'Tersimpan aman & terisolasi di Server Backend via Vault/Env (NIST CSF 2.0 PR.DS-01, Zero Client Exposure).',
        type: 'masked',
        value: 'Terkonfigurasi di Server Proxy (AI_API_KEY)',
        editable: false,
      },
    ],
  },
  {
    id: 'mobile_jkn_sla',
    title: 'Telemetri Mobile JKN Lapis 3, Notifikasi Pasien & SLA Regulasi',
    icon: 'Smartphone',
    description:
      'Kendalikan pengiriman konfirmasi kehadiran pasien (Lapis 3), waktu tunggu konfirmasi, dan peringatan hitung mundur SLA 10 Hari Kerja.',
    settings: [
      {
        key: 'fcm_push_enabled',
        label: 'Verifikasi Kehadiran Peserta via Mobile JKN (FCM)',
        help_text:
          'Kirim permintaan konfirmasi kehadiran 1-klik kepada peserta untuk klaim tindakan berfrekuensi tinggi yang dicurigai.',
        type: 'toggle',
        value: true,
        editable: true,
      },
      {
        key: 'patient_response_timeout_hours',
        label: 'Batas Waktu Tunggu Respons Peserta (Jam)',
        help_text:
          'Waktu tunggu maksimal respons peserta di Mobile JKN sebelum sistem menandai verifikasi sebagai Tidak Ada Respons.',
        type: 'number',
        value: 48,
        editable: true,
      },
      {
        key: 'fcm_retry_count',
        label: 'Batas Pengiriman Ulang Notifikasi FCM (Retry)',
        help_text: 'Jumlah percobaan pengiriman notifikasi pengingat konfirmasi kehadiran bila peserta belum merespons.',
        type: 'number',
        value: 3,
        editable: true,
      },
      {
        key: 'sla_warning_days',
        label: 'Ambang Peringatan Dini Batas SLA (Sisa Hari Kerja)',
        help_text:
          'Munculkan peringatan prioritas tinggi di bilah atas dasbor ketika sisa waktu verifikasi berada di bawah nilai ini.',
        type: 'number',
        value: 7,
        editable: true,
      },
      {
        key: 'digital_file_sharing_fkrtl',
        label: 'Pengiriman Salinan Berkas Digital Klaim Pending ke FKRTL',
        help_text:
          'Kirimkan notifikasi elektronik resmi ke akun Tim Casemix Rumah Sakit saat klaim ditunda atau diminta klarifikasi.',
        type: 'toggle',
        value: true,
        editable: true,
      },
      {
        key: 'statutory_sla_limit',
        label: 'Batas Waktu Verifikasi Klaim Regulasi',
        help_text: 'Diamanatkan oleh Pasal 76 ayat (2) Peraturan Presiden No. 82 Tahun 2018.',
        type: 'text',
        value: '10 Hari Kerja sejak diterbitkannya BAKB',
        editable: false,
      },
    ],
  },
  {
    id: 'cyber_security_compliance',
    title: 'Keamanan Siber, Akses Pengguna & Kepatuhan UU PDP No. 27/2022',
    icon: 'Shield',
    description:
      'Pengaturan durasi sesi aktif verifikator, autentikasi multi-faktor (MFA), pembatasan IP kedinasan, dan jejak audit kriptografis.',
    settings: [
      {
        key: 'session_timeout_minutes',
        label: 'Batas Waktu Sesi Tidak Aktif (Idle Session Timeout - Menit)',
        help_text:
          'Kunci otomatis konsol verifikator apabila tidak ada aktivitas kursor/keyboard dalam kurun waktu ini.',
        type: 'number',
        value: 15,
        editable: true,
      },
      {
        key: 'mfa_mandatory_all',
        label: 'Wajibkan Autentikasi Dua Faktor (MFA - TOTP / Authenticator)',
        help_text: 'Wajibkan verifikasi kode 6 digit saat login bagi seluruh verifikator medis dan tim Wasrik.',
        type: 'toggle',
        value: true,
        editable: true,
      },
      {
        key: 'ip_whitelist_mode',
        label: 'Batasi Akses Hanya dari Jaringan VPN / IP Kedinasan BPJS',
        help_text:
          'Tolak upaya login dari jaringan internet publik yang tidak terdaftar dalam whitelist Kantor Kedeputian Wilayah.',
        type: 'toggle',
        value: true,
        editable: true,
      },
      {
        key: 'audit_log_access_phi',
        label: 'Perekaman Log Akses Berkas Rekam Medis (UU PDP Pasal 35)',
        help_text:
          'Catat setiap pembukaan berkas SEP, resume medis, dan rontgen ke dalam log audit forensik permanen.',
        type: 'toggle',
        value: true,
        editable: true,
      },
      {
        key: 'encryption_standard_at_rest',
        label: 'Standar Enkripsi Data Simpanan (At-Rest Encryption)',
        help_text: 'Standar kriptografis penyimpanan data rekam medis dan klaim di server basis data.',
        type: 'text',
        value: 'AES-256 GCM (Validasi Standar FIPS 140-3 & ISO/IEC 27001)',
        editable: false,
      },
      {
        key: 'rate_limiter_active',
        label: 'Perlindungan Frekuensi Kueri & Anti-Brute-Force (Rate Limiting)',
        help_text: 'Membatasi lonjakan kueri berbahaya dan mengunci IP jika terdeteksi 5 kali kegagalan otorisasi berturut-turut.',
        type: 'toggle',
        value: true,
        editable: true,
      },
      {
        key: 'active_prompt_firewall',
        label: 'Firewall Prompt AI Anti-Injection & Jailbreak (OWASP LLM01:2025)',
        help_text: 'Menapis input prompt dari upaya pengabaian instruksi, ekstraksi prompt sistem, atau teknik DAN/jailbreak.',
        type: 'toggle',
        value: true,
        editable: true,
      },
      {
        key: 'active_phi_scrubber',
        label: 'Pembersih Otomatis Identitas Medis PHI/NIK (UU PDP No. 27/2022)',
        help_text: 'Memastikan seluruh luaran analitik dan API secara otomatis menyamarkan NIK 16 digit dan nomor kartu BPJS.',
        type: 'toggle',
        value: true,
        editable: true,
      },
    ],
  },
  {
    id: 'database_warehouse_connectivity',
    title: 'Konektivitas Database DuckDB Warehouse & Integrasi SATUSEHAT',
    icon: 'Database',
    description:
      'Parameter koneksi gudang data analitik 6.2M transaksi klaim, sinkronisasi master dokter DPJP HFIS BPJS, dan API SATUSEHAT Kemenkes.',
    settings: [
      {
        key: 'duckdb_concurrency_mode',
        label: 'Mode Akses DuckDB Warehouse',
        help_text: 'Mode eksekusi kueri analitik pada berkas data warehouse DuckDB.',
        type: 'select',
        options: [
          { value: 'readonly_concurrent', label: 'Read-Only Concurrent Worker (Direkomendasikan)' },
          { value: 'in_memory_cached', label: 'In-Memory RAM Cache (Performa Tertinggi)' },
        ],
        value: 'readonly_concurrent',
        editable: true,
      },
      {
        key: 'satusehat_sync_interval_hours',
        label: 'Interval Sinkronisasi Master DPJP & SIP SATUSEHAT (Jam)',
        help_text:
          'Frekuensi pengambilan data validasi SIP dokter aktif dari API SATUSEHAT SDMK Kemenkes RI.',
        type: 'number',
        value: 12,
        editable: true,
      },
      {
        key: 'analytics_query_batch_size',
        label: 'Batas Ukuran Batch Pemrosesan Kueri Analitik (Baris)',
        help_text:
          'Jumlah baris data transaksi maksimum yang dipindai per batch saat memuat tabel dan grafik forensik.',
        type: 'number',
        value: 50000,
        editable: true,
      },
      {
        key: 'backend_api_endpoint',
        label: 'Titik Akhir API FastAPI Backend',
        help_text: 'Alamat gateway API mikroservis deteksi klaim dan manajemen audit kriptografis.',
        type: 'text',
        value: 'http://localhost:8000/api/v1 (FastAPI Python 3.14)',
        editable: false,
      },
      {
        key: 'duckdb_total_records',
        label: 'Total Rekam Data Transaksi Aktif di Warehouse',
        help_text:
          'Jumlah total rekam klaim empiris BPJS Kesehatan yang tersimpan dalam data lakehouse DuckDB.',
        type: 'text',
        value: '6.284.192 Rekam Klaim (DuckDB Parquet Columnar Lakehouse)',
        editable: false,
      },
      {
        key: 'sql_firewall_strict',
        label: 'Firewall Kueri SQL DuckDB (Anti-Stacked Queries & Anti-File-Scan)',
        help_text: 'Memblokir injeksi SQL, perintah destruktif (DROP/ALTER/ATTACH), dan upaya pembacaan berkas host melalui DuckDB.',
        type: 'toggle',
        value: true,
        editable: true,
      },
    ],
  },
  {
    id: 'alerts_escalation_center',
    title: 'Pusat Peringatan Dini, Alarm Anomali & Saluran Notifikasi',
    icon: 'Bell',
    description:
      'Konfigurasikan nada alarm peringatan, spanduk mengambang di dasbor, dan format ekspor Berita Acara Kelengkapan Berkas (BAKB).',
    settings: [
      {
        key: 'audio_alert_critical',
        label: 'Alarm Suara untuk Temuan Berkas Jalur Merah Kritis',
        help_text:
          'Bunyikan nada peringatan saat berkas klaim dengan indikasi fraud tinggi terdeteksi di antrean kerja.',
        type: 'toggle',
        value: true,
        editable: true,
      },
      {
        key: 'floating_banner_syndicate',
        label: 'Spanduk Mengambang (Floating Banner) untuk Kasus Sindikat',
        help_text:
          'Tampilkan banner peringatan darurat saat korelasi grafik mendeteksi pola sindikat klaim lintas rumah sakit.',
        type: 'toggle',
        value: true,
        editable: true,
      },
      {
        key: 'email_dispatch_wasrik',
        label: 'Pengiriman Notifikasi Instan via Email Kedinasan Wasrik',
        help_text:
          'Kirimkan notifikasi ringkasan langsung ke email dinas Tim Wasrik jika terjadi lonjakan anomali > 300%.',
        type: 'toggle',
        value: true,
        editable: true,
      },
      {
        key: 'bakb_export_format',
        label: 'Format Ekspor Standar Berita Acara (BAKB)',
        help_text:
          'Format berkas dokumen resmi saat verifikator mengunduh atau mencetak disposisi Berita Acara.',
        type: 'select',
        options: [
          { value: 'pdf_signed', label: 'PDF Bersegel Kriptografis Digital (Rekomendasi Resmi)' },
          { value: 'excel_xlsx', label: 'Excel Spreadsheet (.xlsx) dengan Lembar Data Mentah' },
          { value: 'csv_archive', label: 'CSV Terenkripsi untuk Arsip BSSN' },
        ],
        value: 'pdf_signed',
        editable: true,
      },
    ],
  },
  {
    id: 'cyber_fraud_frameworks',
    title: 'Adopsi 6 Kerangka Kerja Siber & Anti-Fraud Internasional',
    icon: 'CheckCircle2',
    description:
      'Konfigurasi pemetaan TTP internasional: MITRE F3 v1.1, MITRE ATT&CK v19.1, NIST CSF 2.0, MITRE ATLAS, MITRE D3FEND, NIST AI RMF 1.0.',
    settings: [
      {
        key: 'mitre_f3_detection',
        label: 'Deteksi Taktik MITRE Fight Fraud Framework (F3 v1.1)',
        help_text:
          'Aktifkan pendeteksian otomatis Positioning (FA0001: Synthetic Identity & SIP Replay) dan Monetization (FA0002: Unbundling & Payout Exploitation).',
        type: 'toggle',
        value: true,
        editable: true,
      },
      {
        key: 'mitre_attack_sdmk_mapping',
        label: 'Validasi Akun Kedinasan MITRE ATT&CK (T1078 Valid Accounts)',
        help_text:
          'Blokir penagihan dari kredensial dokter spesialis/DPJP yang berstatus non-aktif, mutasi, atau melampaui batas kecepatan fisik geovelocity.',
        type: 'toggle',
        value: true,
        editable: true,
      },
      {
        key: 'nist_csf_continuous_monitoring',
        label: 'Audit Berkelanjutan NIST CSF 2.0 (DE.CM-01)',
        help_text:
          'Audit otomatis 100% berkas klaim masuk secara real-time sebelum penandatanganan Berita Acara Kelengkapan Berkas (BAKB).',
        type: 'toggle',
        value: true,
        editable: true,
      },
      {
        key: 'mitre_atlas_llm_guardrails',
        label: 'Pertahanan AI MITRE ATLAS (AML.T0043 & AML.T0047)',
        help_text:
          'Filter intervensi terhadap manipulasi prompt dan upaya adversarial evasion pengelompokan INA-CBG pada ClaimTrace AI.',
        type: 'toggle',
        value: true,
        editable: true,
      },
      {
        key: 'd3fend_cryptographic_ledger',
        label: 'Integritas Buku Besar MITRE D3FEND (D3-DS & D3-MFA)',
        help_text:
          'Segel setiap keputusan verifikator ke dalam rantai hash SHA-256 anti-rekayasa berstandar FIPS 140-3.',
        type: 'toggle',
        value: true,
        editable: true,
      },
      {
        key: 'nist_ai_rmf_governance',
        label: 'Standar Tata Kelola AI NIST AI RMF 1.0 (GOVERN-1.1)',
        help_text:
          'Pastikan seluruh keluaran inferensi model AI tunduk pada prinsip transparansi, keterbukaan bukti, dan bebas bias sistemik.',
        type: 'toggle',
        value: true,
        editable: true,
      },
    ],
  },
];

function CategoryIcon({ iconName, className = 'w-5 h-5' }) {
  switch (iconName) {
    case 'Palette':
      return <Palette className={className} />;
    case 'Layers':
      return <Layers className={className} />;
    case 'Bot':
      return <Bot className={className} />;
    case 'Smartphone':
      return <Smartphone className={className} />;
    case 'Shield':
      return <Shield className={className} />;
    case 'Database':
      return <Database className={className} />;
    case 'Bell':
      return <Bell className={className} />;
    case 'CheckCircle2':
      return <CheckCircle2 className={className} />;
    default:
      return <Sliders className={className} />;
  }
}

function ThemeSelectorRow({ currentValue, onChange, isLight }) {
  const options = [
    {
      id: 'dark',
      title: 'Cosmic Obsidian',
      subtitle: 'Tema Gelap (Bawaan)',
      badge: 'Gelap',
      badgeColor: isLight ? 'bg-slate-200 text-slate-800 border-slate-300' : 'bg-[#FFCA40]/20 text-[#FFCA40] border-[#FFCA40]/40',
      icon: Moon,
      iconColor: isLight ? 'text-slate-700' : 'text-[#FFCA40]',
      desc: 'Standar visual canggih bernuansa obsidian cosmic. Mengurangi kelelahan mata saat audit intensif dan sif malam.',
      previewBg: 'bg-[#000c24] border-white/20',
      previewAcc: 'bg-[#FFCA40]',
    },
    {
      id: 'light',
      title: 'Clinical White',
      subtitle: 'Tema Terang (BPJS)',
      badge: 'Terang & Bersih',
      badgeColor: isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold',
      icon: Sun,
      iconColor: isLight ? 'text-emerald-600' : 'text-amber-500',
      desc: 'Standar terang fasilitas kesehatan BPJS dengan latar bersih dan kontras tinggi. Ideal untuk ruangan kerja berlampu terang.',
      previewBg: isLight ? 'bg-slate-50 border-slate-300 shadow-xs' : 'bg-white border-slate-300 shadow-sm',
      previewAcc: isLight ? 'bg-emerald-600' : 'bg-emerald-500',
    },
    {
      id: 'system',
      title: 'Sistem Adaptif',
      subtitle: 'Otomatis (OS)',
      badge: 'Auto Detect',
      badgeColor: isLight ? 'bg-cyan-50 text-cyan-800 border-cyan-300' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
      icon: Monitor,
      iconColor: isLight ? 'text-cyan-700' : 'text-cyan-400',
      desc: 'Menyesuaikan mode visual secara otomatis mengikuti preferensi mode gelap atau terang pada sistem operasi perangkat Anda.',
      previewBg: 'bg-gradient-to-r from-[#000c24] to-white border-white/20',
      previewAcc: 'bg-cyan-500',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((opt) => {
          const isSelected = currentValue === opt.id;
          const IconComp = opt.icon;
          return (
            <div
              key={opt.id}
              onClick={() => onChange(opt.id)}
              className={`relative cursor-pointer rounded-2xl border p-4 transition-all duration-300 flex flex-col justify-between ${
                isSelected
                  ? isLight
                    ? 'border-emerald-500 bg-emerald-50/70 shadow-md shadow-sky-100 ring-2 ring-emerald-300'
                    : 'border-[#FFCA40] bg-[#FFCA40]/10 shadow-lg shadow-[#FFCA40]/10 ring-2 ring-[#FFCA40]/40'
                  : isLight
                    ? 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 shadow-xs'
                    : 'border-white/10 bg-[#00102E]/70 hover:bg-[#00102E]/90 hover:border-white/20'
              }`}
            >
              {isSelected && (
                <div className={`absolute top-3 right-3 flex items-center justify-center w-5 h-5 rounded-full ${
                  isLight ? 'bg-emerald-600 text-white shadow-xs' : 'bg-[#FFCA40] text-[#000c24]'
                }`}>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}

              <div>
                {/* Mini Preview Box */}
                <div className={`w-full h-14 rounded-xl border mb-3 p-2 flex items-center justify-between ${opt.previewBg}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-400/20 flex items-center justify-center">
                      <IconComp className={`w-3.5 h-3.5 ${opt.iconColor}`} />
                    </div>
                    <div className="space-y-1">
                      <div className="w-12 h-1.5 rounded-full bg-slate-400/40" />
                      <div className="w-8 h-1 rounded-full bg-slate-400/20" />
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-md ${opt.previewAcc}`} />
                </div>

                <div className="flex items-center gap-2">
                  <h4 className={`text-sm font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {opt.title}
                  </h4>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-semibold ${opt.badgeColor}`}>
                    {opt.badge}
                  </span>
                </div>
                <p className={`text-[11px] font-medium mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
                  {opt.subtitle}
                </p>
                <p className={`text-xs mt-2 leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
                  {opt.desc}
                </p>
              </div>

              <div className={`mt-4 pt-3 border-t flex items-center justify-between ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                <span className={`text-[11px] font-mono ${isLight ? 'text-slate-600 font-medium' : 'text-white/50'}`}>
                  {isSelected ? 'Status: Aktif' : 'Klik untuk memilih'}
                </span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${
                    isSelected 
                      ? (isLight ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'bg-[#FFCA40] text-[#000c24] font-bold') 
                      : isLight 
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200' 
                        : 'bg-white/10 text-white/70'
                  }`}
                >
                  {isSelected ? 'Terpilih' : 'Pilih'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SettingItemRow({ setting, value, onChange, isChanged, isLight }) {
  const [revealed, setRevealed] = useState(false);
  const isEditable = setting.editable && setting.type !== 'masked';
  const currentValue = value !== undefined ? value : setting.value;

  if (setting.type === 'theme_selector') {
    return (
      <div
        className={`relative flex flex-col gap-4 rounded-2xl border p-5 transition-colors ${
          isChanged
            ? 'border-emerald-500/40 bg-emerald-500/10'
            : isLight
              ? 'border-slate-200 bg-slate-50/80 shadow-xs'
              : 'border-white/10 bg-[#00102E]/70'
        }`}
      >
        {isChanged && (
          <div
            className="absolute -left-1 -top-1 h-3 w-3 rounded-full bg-emerald-400 shadow-sm"
            title="Perubahan tema belum disimpan"
          />
        )}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`font-semibold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {setting.label}
            </span>
            <span className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider border ${
              isLight 
                ? 'bg-amber-100 text-amber-800 border-amber-300' 
                : 'bg-[#FFCA40]/20 text-[#FFCA40] border-[#FFCA40]/30'
            }`}>
              Interaktif
            </span>
          </div>
          {setting.help_text && (
            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
              {setting.help_text}
            </p>
          )}
        </div>

        <ThemeSelectorRow
          currentValue={currentValue}
          onChange={(newVal) => onChange && onChange(newVal)}
          isLight={isLight}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col gap-4 rounded-xl border p-5 transition-colors sm:flex-row sm:items-start sm:justify-between ${
        isChanged
          ? 'border-emerald-500/40 bg-emerald-500/10'
          : isLight
            ? 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70'
            : 'border-white/10 bg-[#00102E]/70 hover:bg-[#00102E]/90'
      }`}
    >
      {isChanged && (
        <div
          className="absolute -left-1 -top-1 h-3 w-3 rounded-full bg-emerald-400 shadow-sm"
          title="Perubahan belum disimpan"
        />
      )}

      <div className="flex-1 space-y-1.5 pr-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <label
            htmlFor={setting.key}
            className={`font-semibold text-sm cursor-pointer ${isLight ? 'text-slate-900' : 'text-white'}`}
          >
            {setting.label}
          </label>
          <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            isLight ? 'bg-slate-200 text-slate-700' : 'bg-white/10 text-white/70'
          }`}>
            {setting.type}
          </span>
          {!isEditable && (
            <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
              isLight ? 'bg-slate-100 text-slate-500 border-slate-300' : 'bg-white/5 text-white/40 border-white/10'
            }`}>
              Baca-Saja
            </span>
          )}
        </div>
        {setting.help_text && (
          <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            {setting.help_text}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center sm:min-w-[260px] sm:justify-end">
        {isEditable && onChange ? (
          setting.type === 'toggle' ? (
            <button
              id={setting.key}
              type="button"
              role="switch"
              aria-checked={Boolean(currentValue)}
              onClick={() => onChange(!currentValue)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                currentValue 
                  ? (isLight ? 'bg-emerald-600' : 'bg-[#FFCA40]') 
                  : (isLight ? 'bg-slate-300' : 'bg-white/20')
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  currentValue ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          ) : setting.type === 'number' ? (
            <input
              id={setting.key}
              type="number"
              value={String(currentValue ?? '')}
              onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
              className={`w-full sm:w-36 rounded-lg border px-3.5 py-2 text-sm transition-colors focus:outline-none focus:ring-2 font-mono font-bold ${
                isLight 
                  ? 'border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-amber-500/20' 
                  : 'border-white/10 bg-white/5 text-white placeholder-white/40 focus:border-[#FFCA40]/60 focus:ring-[#FFCA40]/20'
              }`}
            />
          ) : setting.type === 'select' ? (
            <select
              id={setting.key}
              value={String(currentValue ?? '')}
              onChange={(e) => onChange(e.target.value)}
              className={`w-full sm:w-64 rounded-lg border px-3.5 py-2 text-xs focus:outline-none focus:ring-2 transition-colors cursor-pointer ${
                isLight 
                  ? 'border-slate-300 bg-white text-slate-900 shadow-xs focus:border-amber-500 focus:ring-amber-500/20' 
                  : 'border-white/10 bg-[#000c24] text-white focus:border-[#FFCA40]/60 focus:ring-[#FFCA40]/20'
              }`}
            >
              {(setting.options || []).map((opt) => (
                <option key={opt.value} value={opt.value} className={isLight ? 'bg-white text-slate-900' : 'bg-[#000c24] text-white'}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={setting.key}
              type="text"
              value={String(currentValue ?? '')}
              onChange={(e) => onChange(e.target.value)}
              className={`w-full sm:w-64 rounded-lg border px-3.5 py-2 text-sm transition-colors focus:outline-none focus:ring-2 ${
                isLight 
                  ? 'border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-amber-500/20' 
                  : 'border-white/10 bg-white/5 text-white placeholder-white/40 focus:border-[#FFCA40]/60 focus:ring-[#FFCA40]/20'
              }`}
            />
          )
        ) : setting.type === 'masked' ? (
          <div className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-xs ${
            isLight ? 'border-slate-300 bg-slate-100 text-slate-800' : 'border-white/10 bg-white/5 text-white/80'
          }`}>
            <span>{revealed ? 'TERENKRIPSI-DI-SERVER-VAULT' : String(setting.value)}</span>
            <button
              type="button"
              onClick={() => setRevealed(!revealed)}
              className="ml-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              title={revealed ? 'Sembunyikan nilai' : 'Tampilkan status'}
            >
              {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        ) : (
          <div className={`font-mono text-xs px-3 py-1.5 rounded-lg border max-w-xs truncate ${
            isLight ? 'border-slate-300 bg-slate-100 text-slate-800' : 'border-white/10 bg-white/5 text-white/80'
          }`}>
            {String(setting.value)}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsCategoryCard({ category, onSaveCategory, onThemeChangeLive, currentTheme }) {
  const [editedValues, setEditedValues] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const isLight = currentTheme === 'light';

  const editableSettings = category.settings.filter((s) => s.editable && s.type !== 'masked');
  const readOnlySettings = category.settings.filter((s) => !s.editable || s.type === 'masked');

  const hasChanges = editableSettings.some(
    (s) => s.key in editedValues && editedValues[s.key] !== s.value
  );

  const handleValueChange = (key, val) => {
    setEditedValues((prev) => ({ ...prev, [key]: val }));
    // Jika perubahan adalah tema, terapkan langsung untuk preview instan
    if (key === 'ui_theme_mode' && onThemeChangeLive) {
      onThemeChangeLive(val);
    }
  };

  const handleReset = () => {
    // Kembalikan tema jika ada
    if ('ui_theme_mode' in editedValues && onThemeChangeLive) {
      const originalTheme = category.settings.find((s) => s.key === 'ui_theme_mode')?.value || 'dark';
      onThemeChangeLive(originalTheme);
    }
    setEditedValues({});
  };

  const handleSave = () => {
    if (!hasChanges) return;
    setIsSaving(true);
    setTimeout(() => {
      onSaveCategory(category.id, editedValues, category.title);
      setEditedValues({});
      setIsSaving(false);
    }, 400);
  };

  return (
    <section 
      id={category.id}
      className={`relative overflow-hidden rounded-2xl border p-6 shadow-xl backdrop-blur-xl scroll-mt-24 transition-colors duration-300 ${
        isLight
          ? 'border-slate-200 bg-white text-slate-900 shadow-slate-200/50'
          : 'border-white/10 bg-[#00153A]/85 text-white shadow-[#00081c]/50'
      }`}
    >
      <div className={`mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 ${
        isLight ? 'border-slate-200' : 'border-white/10'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
            isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white/10 border-white/15 text-[#FFCA40]'
          }`}>
            <CategoryIcon iconName={category.icon} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {category.title}
              </h2>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-white/10 text-white/70 border-white/15'
              }`}>
                {category.settings.length} Opsi
              </span>
            </div>
            <p className={`mt-1 text-xs leading-relaxed max-w-3xl ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
              {category.description}
            </p>
          </div>
        </div>

        {hasChanges && (
          <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-full shrink-0 animate-pulse font-bold">
            Ada Perubahan
          </span>
        )}
      </div>

      {editableSettings.length > 0 && (
        <div className="space-y-3.5">
          {editableSettings.map((setting) => {
            const isChanged =
              setting.key in editedValues && editedValues[setting.key] !== setting.value;
            const currentValue =
              setting.key in editedValues ? editedValues[setting.key] : setting.value;
            return (
              <SettingItemRow
                key={setting.key}
                setting={setting}
                value={currentValue}
                onChange={(val) => handleValueChange(setting.key, val)}
                isChanged={isChanged}
                isLight={isLight}
              />
            );
          })}
        </div>
      )}

      {editableSettings.length > 0 && readOnlySettings.length > 0 && (
        <hr className={`my-6 ${isLight ? 'border-slate-200' : 'border-white/10'}`} />
      )}

      {readOnlySettings.length > 0 && (
        <div className="space-y-3.5">
          <h3 className={`mb-3 text-[11px] font-bold tracking-widest uppercase ${
            isLight ? 'text-slate-500' : 'text-white/40'
          }`}>
            Konfigurasi Sistem Tetap &amp; Kepatuhan Regulasi (Baca-Saja)
          </h3>
          {readOnlySettings.map((setting) => (
            <SettingItemRow 
              key={setting.key} 
              setting={setting} 
              isLight={isLight}
            />
          ))}
        </div>
      )}

      {editableSettings.length > 0 && (
        <div className={`mt-6 flex items-center justify-end gap-3 border-t pt-5 ${
          isLight ? 'border-slate-200' : 'border-white/10'
        }`}>
          <button
            type="button"
            onClick={handleReset}
            disabled={!hasChanges || isSaving}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer ${
              isLight 
                ? 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200' 
                : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
            }`}
          >
            <X className="h-4 w-4" />
            Batalkan
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer shadow-md ${
              isLight
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Simpan Perubahan
          </button>
        </div>
      )}
    </section>
  );
}

export default function AdminSettingsView({ onBackToDashboard, currentTheme = 'dark', onThemeChange }) {
  const [systemPrefersLight, setSystemPrefersLight] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: light)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = (e) => setSystemPrefersLight(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const effectiveTheme = currentTheme === 'system' ? (systemPrefersLight ? 'light' : 'dark') : currentTheme;
  const isLight = effectiveTheme === 'light';

  const [categories, setCategories] = useState(() => {
    return INITIAL_SETTINGS_CATEGORIES.map((cat) => {
      if (cat.id === 'appearance_theme') {
        return {
          ...cat,
          settings: cat.settings.map((s) =>
            s.key === 'ui_theme_mode' ? { ...s, value: currentTheme } : s
          ),
        };
      }
      return cat;
    });
  });

  const [activeFilter, setActiveFilter] = useState('all');
  const [toast, setToast] = useState(null);

  // Auto-dismiss Toast Notification setelah 3.5 detik
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === 'appearance_theme') {
          return {
            ...cat,
            settings: cat.settings.map((s) =>
              s.key === 'ui_theme_mode' ? { ...s, value: currentTheme } : s
            ),
          };
        }
        return cat;
      })
    );
  }, [currentTheme]);

  const handleSaveCategory = (catId, editedValues, catTitle) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          settings: cat.settings.map((s) =>
            s.key in editedValues ? { ...s, value: editedValues[s.key] } : s
          ),
        };
      })
    );

    if ('ui_theme_mode' in editedValues && onThemeChange) {
      onThemeChange(editedValues.ui_theme_mode);
      try {
        localStorage.setItem('claimtrace_theme', editedValues.ui_theme_mode);
      } catch (e) {
        console.error(e);
      }
    }

    setToast({ message: `${catTitle} berhasil disimpan!`, type: 'success' });
    setTimeout(() => setToast(null), 3500);
  };

  const filteredCategories = activeFilter === 'all'
    ? categories
    : categories.filter((c) => c.id === activeFilter);

  return (
    <div className={`mx-auto max-w-5xl space-y-8 pb-12 transition-colors duration-300 ${
      isLight ? 'text-slate-900' : 'text-white'
    }`}>
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.message}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`fixed top-20 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-semibold shadow-xl backdrop-blur-md overflow-hidden ${
              isLight 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              aria-label="Tutup notifikasi"
              className={`ml-2 p-0.5 rounded cursor-pointer ${
                isLight ? 'hover:bg-emerald-100 text-emerald-600' : 'hover:bg-emerald-500/30 text-emerald-300'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
            {/* Animasi Garis Countdown Waktu Menghilang */}
            <motion.div
              key={`progress-${toast.message}`}
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 3.5, ease: "linear" }}
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Pengaturan */}
      <header className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6 ${
        isLight ? 'border-slate-200' : 'border-white/10'
      }`}>
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shadow-md ${
              isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white/10 border-white/15 text-[#FFCA40]'
            }`}>
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <h1 className={`text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                <span>Pengaturan Sistem &amp; Kebijakan Audit</span>
                <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border font-bold ${
                  isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-[#FFCA40]/20 text-[#FFCA40] border-[#FFCA40]/30'
                }`}>
                  8 Kategori Lengkap
                </span>
              </h1>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                Kelola parameter operasional, preferensi tema (Gelap/Terang/Sistem), ambang batas fusi tiga lapis, dan kepatuhan regulasi BPJS Kesehatan.
              </p>
            </div>
          </div>
        </div>

        {onBackToDashboard && (
          <button
            type="button"
            onClick={onBackToDashboard}
            className={`self-start sm:self-auto rounded-xl border px-4 py-2 text-xs font-bold transition cursor-pointer shrink-0 shadow-md flex items-center gap-2 ${
              isLight 
                ? 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100' 
                : 'border-white/15 bg-white/10 hover:bg-white/15 text-white'
            }`}
          >
            <span>Kembali ke Dasbor</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </header>

      {/* Kategori Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            activeFilter === 'all'
              ? (isLight ? 'bg-emerald-600 text-white shadow-md' : 'bg-[#FFCA40] text-[#000c24] shadow-md')
              : isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300/80'
                : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Semua Kategori ({categories.length})</span>
        </button>

        {categories.map((cat) => {
          const isActive = activeFilter === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? (isLight ? 'bg-emerald-600 text-white shadow-md' : 'bg-[#FFCA40] text-[#000c24] shadow-md')
                  : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300/80'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
              }`}
            >
              <CategoryIcon iconName={cat.icon} className="w-3.5 h-3.5" />
              <span>{cat.title.split('&')[0].split(',')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Daftar Kategori Pengaturan */}
      <div className="space-y-6">
        {filteredCategories.map((category) => (
          <SettingsCategoryCard
            key={category.id}
            category={category}
            currentTheme={effectiveTheme}
            onSaveCategory={handleSaveCategory}
            onThemeChangeLive={onThemeChange}
          />
        ))}
      </div>

      {/* Footer Info & Disclaimers */}
      <footer className={`mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs ${
        isLight ? 'border-slate-200 text-slate-500' : 'border-white/10 text-white/50'
      }`}>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span>Seluruh perubahan konfigurasi otomatis dicatat dalam audit trail terenkripsi SHA-256 (ISO 27001).</span>
        </div>
        <div className="font-mono text-[11px] text-slate-400">
          ClaimTrace Ver. 2.4.0 &bull; Kantor Pusat BPJS Kesehatan
        </div>
      </footer>
    </div>
  );
}

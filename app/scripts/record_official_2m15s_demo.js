import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = '/home/Khalaf-Dev/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome';
const BASE_URL = 'https://claimtrace-healthkathon.vercel.app';
const OUTPUT_DIR = '/mnt/c/Users/Asus/Downloads/HealthKathon/videos';
const LOCAL_DIR = '/home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/videos';

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function injectVisualCursor(page) {
  await page.evaluate(() => {
    if (document.getElementById('custom-cursor')) return;
    const cursor = document.createElement('div');
    cursor.id = 'custom-cursor';
    cursor.style.cssText = `
      width: 22px;
      height: 22px;
      border: 2.5px solid #10b981;
      border-radius: 50%;
      position: fixed;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 9999999;
      transform: translate(-50%, -50%);
      transition: width 0.15s ease, height 0.15s ease, background 0.15s ease, border-color 0.15s ease;
      background: rgba(16, 185, 129, 0.35);
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.6);
    `;
    document.body.appendChild(cursor);

    window.addEventListener('mousemove', e => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    });

    window.addEventListener('mousedown', () => {
      cursor.style.transform = 'translate(-50%, -50%) scale(0.75)';
      cursor.style.background = 'rgba(239, 68, 68, 0.6)';
      cursor.style.borderColor = '#ef4444';
      cursor.style.boxShadow = '0 0 16px rgba(239, 68, 68, 0.8)';
    });

    window.addEventListener('mouseup', () => {
      cursor.style.transform = 'translate(-50%, -50%) scale(1)';
      cursor.style.background = 'rgba(16, 185, 129, 0.35)';
      cursor.style.borderColor = '#10b981';
      cursor.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.6)';
    });
  });
}

async function smoothMouseMove(page, targetX, targetY, steps = 25) {
  await page.mouse.move(targetX, targetY, { steps });
}

async function smoothScroll(page, distance, durationMs = 1500) {
  const steps = 20;
  const stepDistance = distance / steps;
  const stepDelay = durationMs / steps;
  for (let i = 0; i < steps; i++) {
    await page.evaluate((d) => window.scrollBy(0, d), stepDistance);
    await wait(stepDelay);
  }
}

async function recordExact2m15sDemo() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOCAL_DIR)) {
    fs.mkdirSync(LOCAL_DIR, { recursive: true });
  }

  console.log('--- STARTING OFFICIAL 2M 15S DEMO RECORDING ---');
  console.log('Target duration: ±135 seconds (2 Menit 15 Detik)');
  console.log('Resolution: 1920x1080 (1080p)');

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1920,1080']
  });

  const context = await browser.newContext({
    recordVideo: {
      dir: LOCAL_DIR,
      size: { width: 1920, height: 1080 }
    },
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();
  const startTime = Date.now();

  try {
    // =========================================================================
    // TRANSISI DI SLIDE 5 KE APLIKASI (±10 Detik) — Amay
    // =========================================================================
    console.log('[00:00] Transisi: Membuka Aplikasi ClaimTrace (Dual-Cockpit)...');
    await page.goto(`${BASE_URL}?view=dashboard&tab=executive&mode=split`, { waitUntil: 'networkidle', timeout: 35000 });
    await injectVisualCursor(page);
    await wait(3000);
    await smoothMouseMove(page, 450, 200, 20);
    await wait(7000); // Pas 10 detik

    // =========================================================================
    // LANGKAH 1: TRIAGE ANTREAN & DETEKSI KLASTER (±30 Detik) — Amay
    // =========================================================================
    console.log('[00:10] Langkah 1: Triage Antrean & Deteksi Klaster (RS Mitra Husada)...');
    // Sorot barisan triage Hijau/Kuning/Merah
    await smoothMouseMove(page, 280, 160, 20);
    await wait(4000);

    // Scroll ke chart & antrean
    await smoothScroll(page, 350, 1500);
    await wait(4000);

    // Beralih ke Antrean Triase
    await page.goto(`${BASE_URL}?view=dashboard&tab=queue&mode=split`, { waitUntil: 'networkidle' });
    await injectVisualCursor(page);
    await wait(2500);

    // Sorot klaster mencolok RS Khusus Mitra Husada (85 klaim fisioterapi, Skor 87)
    console.log('Menyorot baris RS Khusus Mitra Husada (Jalur Merah, Skor Risiko 87)...');
    await smoothMouseMove(page, 520, 310, 20);
    await wait(8000);

    // Sorot indikator Jalur Merah
    await smoothMouseMove(page, 240, 310, 15);
    await wait(10000); // Total langkah 1: 30 detik

    // =========================================================================
    // LANGKAH 2: INSPEKSI MATRIKS BUKTI LAPIS 1 & 2 (±35 Detik) — Amay
    // =========================================================================
    console.log('[00:40] Langkah 2: Inspeksi Matriks Bukti 3 Lapis (Lapis 1 & Lapis 2)...');
    // Klik klaster RS Mitra Husada hingga panel Matriks Bukti 3 Lapis terbuka
    await page.goto(`${BASE_URL}?view=dashboard&tab=investigation&mode=split`, { waitUntil: 'networkidle' });
    await injectVisualCursor(page);
    await wait(2500);

    // Tunjukkan grafik lonjakan klaim Lapis 1 (8,5x baseline)
    console.log('Menyorot Lapis 1: Lonjakan klaim 8,5x baseline normal...');
    await smoothMouseMove(page, 480, 220, 20);
    await wait(5000);

    // Scroll ke grafik anomali spike dan episode fingerprint
    await smoothScroll(page, 320, 1500);
    await wait(3000);
    await smoothMouseMove(page, 450, 420, 20);
    await wait(7000);

    // Tunjukkan Lapis 2: Uji Jejak SATUSEHAT SDMK (SIP dokter DPJP berakhir)
    console.log('Menyorot Lapis 2: Validasi SATUSEHAT SDMK (SIP DPJP Berakhir - Hard Trigger)...');
    await smoothScroll(page, 300, 1500);
    await wait(2000);
    await smoothMouseMove(page, 480, 520, 20);
    await wait(14000); // Total langkah 2: 35 detik

    // =========================================================================
    // LANGKAH 3: SIMULASI LIVE MOBILE JKN LAPIS 3 (±30 Detik) — Khalaf
    // =========================================================================
    console.log('[01:15] Langkah 3: Simulasi Live Mobile JKN (Lapis 3)...');
    // Arahkan kursor ke smartphone simulator di sebelah kanan
    await smoothMouseMove(page, 1580, 320, 25);
    await wait(3000);

    // Buka notifikasi presensi
    console.log('Membuka dialog verifikasi presensi peserta...');
    await page.evaluate(() => {
      const ctaBtn = Array.from(document.querySelectorAll('span, button, div')).find(el => el.textContent && el.textContent.includes('Ketuk untuk tinjau bukti konfirmasi'));
      if (ctaBtn) ctaBtn.click();
    });
    await wait(3000);

    // Sorot pertanyaan presensi di ponsel peserta
    await smoothMouseMove(page, 1580, 480, 20);
    await wait(4000);

    // Klik tombol [Tidak Pernah]
    console.log('Peserta menekan tombol: [Tidak Pernah]...');
    const denyClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const denyBtn = buttons.find(b => b.textContent && (b.textContent.includes('Tidak Pernah') || b.textContent.includes('Pernah Menerima')));
      if (denyBtn) {
        denyBtn.click();
        return true;
      }
      return false;
    });

    if (denyClicked) {
      console.log('Tombol [Tidak Pernah] berhasil ditekan!');
    } else {
      await page.goto(`${BASE_URL}?view=dashboard&tab=investigation&mode=split&response=denied`, { waitUntil: 'networkidle' });
    }
    await wait(4000);

    // Sorot reaksi real-time di cockpit verifikator
    console.log('Menyorot reaksi real-time di cockpit verifikator (Indikasi Phantom Billing)...');
    await smoothMouseMove(page, 520, 300, 25);
    await wait(14000); // Total langkah 3: 30 detik

    // =========================================================================
    // LANGKAH 4: EKSEKUSI KEPUTUSAN & CETAK AUDIT SHA-256 (±30 Detik) — Khalaf
    // =========================================================================
    console.log('[01:45] Langkah 4: Eksekusi Keputusan & Cetak Audit SHA-256...');
    // Buka Decision Console
    await page.goto(`${BASE_URL}?view=dashboard&tab=decision&mode=split`, { waitUntil: 'networkidle' });
    await injectVisualCursor(page);
    await wait(2500);

    // Sorot tombol [Tunda Berita Acara & Minta Klarifikasi]
    console.log('Menyorot tombol [Tunda Berita Acara & Minta Klarifikasi]...');
    await smoothMouseMove(page, 480, 420, 20);
    await wait(6000);

    // Klik tombol keputusan
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btnTunda = btns.find(b => b.textContent && b.textContent.includes('Tunda Berita Acara'));
      if (btnTunda) btnTunda.click();
    });
    await wait(4000);

    // Tampilkan Berkas Telaah Siap-Audit beserta stempel hash SHA-256
    console.log('Beralih ke Berkas Telaah Siap-Audit (Audit Ledger SHA-256)...');
    await page.goto(`${BASE_URL}?view=dashboard&tab=audit&mode=split`, { waitUntil: 'networkidle' });
    await injectVisualCursor(page);
    await wait(2500);

    // Sorot kode hash SHA-256 anti-manipulasi
    console.log('Menyorot kode hash kriptografis SHA-256 di bagian bawah...');
    await smoothMouseMove(page, 480, 320, 20);
    await wait(6000);

    await smoothScroll(page, 300, 1500);
    await wait(7000); // Total langkah 4: 30 detik

    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`--- OFFICIAL 2M 15S DEMO COMPLETED IN ${elapsedSeconds} SECONDS (~${(elapsedSeconds/60).toFixed(2)} MINUTES) ---`);

  } catch (err) {
    console.error('Error during 2m 15s recording:', err);
  } finally {
    await context.close();
    await browser.close();

    const files = fs.readdirSync(LOCAL_DIR).filter(f => f.endsWith('.webm'));
    if (files.length > 0) {
      files.sort((a, b) => fs.statSync(path.join(LOCAL_DIR, b)).mtimeMs - fs.statSync(path.join(LOCAL_DIR, a)).mtimeMs);
      const latestVideo = path.join(LOCAL_DIR, files[0]);
      const targetPath = path.join(OUTPUT_DIR, 'ClaimTrace_Official_Demo_2m15s.webm');
      fs.copyFileSync(latestVideo, targetPath);
      
      const stats = fs.statSync(targetPath);
      console.log(`Successfully generated 2m 15s video demo:`);
      console.log(`Path: ${targetPath}`);
      console.log(`Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
    }
  }
}

recordExact2m15sDemo();

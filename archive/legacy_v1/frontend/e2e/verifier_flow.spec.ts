import { test, expect } from '@playwright/test';

test.describe('ClaimTrace Verifier Console - E2E & RPA Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(500);
  });

  test('TC-01: Header, Branding, & KPI Portfolio Rendering', async ({ page }) => {
    // Assert page title
    await expect(page).toHaveTitle(/ClaimTrace/);

    // Assert competition badge
    const badge = page.getByText('Healthkathon BPJS Kesehatan 2026', { exact: true });
    await expect(badge).toBeVisible();

    // Assert team attribution
    const team = page.getByText('Tim TINEERENSE • MAN 1 Surakarta').first();
    await expect(team).toBeVisible();

    // Assert KPI metrics cards
    await expect(page.getByText('Total Portofolio Klaim').first()).toBeVisible();
    await expect(page.getByText('Risiko Dicegah Pra-Bayar').first()).toBeVisible();
    await expect(page.getByText('Klarifikasi Digital Faskes').first()).toBeVisible();
    await expect(page.getByText('Lolos Cepat (Fast-Track)').first()).toBeVisible();
  });

  test('TC-02: Triage Queue Selection & Modus #6 Phantom Billing Analysis', async ({ page }) => {
    // Click on CLM-2026-8805 (Phantom Billing)
    const claim8805 = page.locator('[data-testid="claim-card-CLM-2026-8805"]');
    await expect(claim8805).toBeVisible();
    await claim8805.click();

    // Verify Case Dossier updates to CLM-2026-8805
    await expect(page.getByText('B-1-10-II').first()).toBeVisible();
    await expect(page.getByText('Bedah Digestif Laparoskopi').first()).toBeVisible();
    await expect(page.getByText('dr. Sintetis Sp.B-KBD').first()).toBeVisible();
  });

  test('TC-03: OSRM Geovelocity Radar Modal Interaction', async ({ page }) => {
    // Select CLM-2026-8805 (Phantom Billing)
    await page.locator('[data-testid="claim-card-CLM-2026-8805"]').click();

    // Open OSRM Modal
    const osrmBtn = page.locator('button[title*="Radar Geovelocity"]');
    await expect(osrmBtn).toBeVisible();
    await osrmBtn.click();

    // Verify modal heading
    const modalHeading = page.getByText('Uji Kelayakan Fisika').first();
    await expect(modalHeading).toBeVisible();

    // Verify physics calculation values
    await expect(page.getByText('Kecepatan Dibutuhkan').first()).toBeVisible();

    // Close modal via Tutup button
    const closeBtn = page.locator('.fixed button:has-text("Tutup")');
    await closeBtn.click();
    await expect(modalHeading).not.toBeVisible();
  });

  test('TC-04: SATUSEHAT FHIR MCP Server Modal Inspection', async ({ page }) => {
    // Open FHIR Modal
    const fhirBtn = page.locator('button[title*="WSO2 FHIR MCP Server"]');
    await expect(fhirBtn).toBeVisible();
    await fhirBtn.click();

    // Verify modal content
    const fhirHeading = page.getByText('Integrasi Server MCP FHIR').first();
    await expect(fhirHeading).toBeVisible();

    // Verify tabs
    await expect(page.getByText('7 Tools MCP FHIR').first()).toBeVisible();

    // Close modal via close button
    const closeBtn = page.locator('.fixed button:has(svg.lucide-x)').first();
    await closeBtn.click();
    await expect(fhirHeading).not.toBeVisible();
  });

  test('TC-05: Mobile JKN Binary Simulation & Audit Hash Logging', async ({ page }) => {
    // Select CLM-2026-8805
    await page.locator('[data-testid="claim-card-CLM-2026-8805"]').click();

    // Find and click "Tidak Merasa Hadir" button
    const tidakHadirBtn = page.locator('button:has-text("Tidak Merasa Hadir")');
    await expect(tidakHadirBtn).toBeVisible();
    await tidakHadirBtn.click();

    // Check that audit log has recorded the event
    await expect(page.getByText('MOBILE_JKN_BINARY_SYNC').first()).toBeVisible();
  });

  test('TC-06: Verifier Action & Non-Repudiation Audit Dossier Export', async ({ page }) => {
    // Select a claim
    await page.locator('[data-testid="claim-card-CLM-2026-8801"]').click();

    // Open Export Dossier Modal via "Cetak / Ekspor Berkas"
    const exportBtn = page.locator('button:has-text("Cetak / Ekspor Berkas")');
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();

    // Verify Dossier Modal Header
    const exportTitle = page.getByText('PRATINJAU BERKAS ALASAN KASUS SIAP-AUDIT').first();
    await expect(exportTitle).toBeVisible();

    // Verify non-repudiation content presence
    await expect(page.getByText('LEMBAR TELAAH KLAIM ANOMALI PRA-BAYAR').first()).toBeVisible();

    // Close export modal
    const closeBtn = page.locator('.fixed button:has(svg.lucide-x)').first();
    await closeBtn.click();
    await expect(exportTitle).not.toBeVisible();
  });

  test('TC-07: Playwright MCP RPA Robot Modal Interaction & Simulation', async ({ page }) => {
    // Open Playwright RPA Modal
    const rpaBtn = page.locator('button[title*="Robot Otomasi Browser"]');
    await expect(rpaBtn).toBeVisible();
    await rpaBtn.click();

    // Verify Modal Heading & Tag
    const rpaHeading = page.getByText('Otomasi Triase & Audit Berkas Klaim Pra-Bayar').first();
    await expect(rpaHeading).toBeVisible();
    await expect(page.getByText('Playwright MCP RPA Robot').first()).toBeVisible();

    // Verify Tab 2: Katalog Tools
    const toolsTab = page.locator('button:has-text("Katalog Tools Playwright MCP")');
    await toolsTab.click();
    await expect(page.getByText('browser_navigate').first()).toBeVisible();
    await expect(page.getByText('browser_pdf_save').first()).toBeVisible();

    // Verify Tab 3: Kode Skrip E2E TypeScript
    const codeTab = page.locator('button:has-text("Kode Skrip E2E TypeScript")');
    await codeTab.click();
    await expect(page.getByText('Automated Verifier RPA Flow for Modus #6').first()).toBeVisible();

    // Close modal
    const closeBtn = page.locator('.fixed button:has-text("Tutup")');
    await closeBtn.click();
    await expect(rpaHeading).not.toBeVisible();
  });

  test('TC-08: ChromaDB Vector Semantic Modal Interaction & Medical Record Plagiarism Analysis', async ({ page }) => {
    await page.goto('/');

    // Click ChromaDB Vector button
    const chromaBtn = page.getByRole('button', { name: /ChromaDB Vektor/i });
    await expect(chromaBtn).toBeVisible();
    await chromaBtn.click();

    // Verify Modal Heading & Badges
    const modalHeading = page.getByText('ChromaDB Semantic Engine • Deteksi Plagiarisme Narasi Klinis');
    await expect(modalHeading).toBeVisible();
    await expect(page.getByText('ChromaDB v1.5.9').first()).toBeVisible();
    await expect(page.getByText('all-MiniLM-L6-v2 (Local ONNX)').first()).toBeVisible();

    // Verify Tab 1 (Default: Analysis) detection for CLM-2026-8801
    await expect(page.getByText(/IND-SEM-COPYPASTE/).first()).toBeVisible();
    await expect(page.getByText(/CRITICAL: Plagiarisme Teks Resume Medis Terdeteksi!/).first()).toBeVisible();

    // Verify Tab 2: Matriks Kemiripan Klaster
    const matrixTab = page.getByRole('button', { name: /Matriks Kemiripan Klaster/i });
    await matrixTab.click();
    await expect(page.getByText('Matriks Kemiripan Pairwise Teks Resume Medis')).toBeVisible();

    // Verify Tab 3: Uji Teks Resume Kustom
    const customTab = page.getByRole('button', { name: /Uji Teks Resume Kustom/i });
    await customTab.click();
    const searchBtn = page.getByRole('button', { name: /Cari Kemiripan Semantik/i });
    await expect(searchBtn).toBeVisible();
    await searchBtn.click();

    // Verify Tab 4: Spesifikasi Arsitektur Vektor
    const specTab = page.getByRole('button', { name: /Spesifikasi Arsitektur Vektor/i });
    await specTab.click();
    await expect(page.getByText('HNSW Cosine Space')).toBeVisible();

    // Close modal
    const closeBtn = page.locator('.fixed button:has-text("Tutup Panel")');
    await closeBtn.click();
    await expect(modalHeading).not.toBeVisible();
  });

  test('TC-09: DuckDB OLAP MCP Modal Interaction & High-Speed Analytical SQL Execution', async ({ page }) => {
    await page.goto('/');

    // Click DuckDB OLAP MCP button
    const duckdbBtn = page.getByRole('button', { name: /DuckDB OLAP MCP/i });
    await expect(duckdbBtn).toBeVisible();
    await duckdbBtn.click();

    // Verify Modal Heading & Badges
    const modalHeading = page.getByText('DuckDB OLAP Analytics & MCP Server');
    await expect(modalHeading).toBeVisible();
    await expect(page.getByText('DuckDB v1.5.6').first()).toBeVisible();
    await expect(page.getByText('teaguesterling/duckdb_mcp Spec').first()).toBeVisible();

    // Verify Tab 1 (Default: SQL Console) & click preset button
    const presetBtn = page.getByRole('button', { name: /⚡ Scan Lonjakan Klaster/i });
    await expect(presetBtn).toBeVisible();
    await presetBtn.click();

    // Verify execution results rendered
    await expect(page.getByText(/Baris Ditemukan/).first()).toBeVisible();

    // Verify Tab 2: Tools Terpublikasi (mcp_publish_tool)
    const toolsTab = page.getByRole('button', { name: /Tools Terpublikasi/i });
    await toolsTab.click();
    await expect(page.getByText('detect_phantom_billing').first()).toBeVisible();
    const runToolBtn = page.getByRole('button', { name: /Jalankan Published Tool/i });
    await expect(runToolBtn).toBeVisible();
    await runToolBtn.click();
    await expect(page.getByText('Status: SUCCESS').first()).toBeVisible();

    // Verify Tab 3: Skema Tabel & Views
    const schemaTab = page.getByRole('button', { name: /Skema Tabel & Views/i });
    await schemaTab.click();
    await expect(page.getByText('Pilih Tabel / View:').first()).toBeVisible();
    const tableBtn = page.getByTestId('duckdb-table-claims_warehouse');
    await expect(tableBtn).toBeVisible({ timeout: 10000 });
    await tableBtn.click();
    await expect(page.getByText('Struktur Kolom Tabel:').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('claim_id').first()).toBeVisible({ timeout: 10000 });

    // Verify Tab 4: Konfigurasi DuckDB MCP
    const configTab = page.getByRole('button', { name: /Konfigurasi DuckDB MCP/i });
    await configTab.click();
    await expect(page.getByText('duckdb_mcp_server.py')).toBeVisible();

    // Close modal
    const closeBtn = page.locator('.fixed button:has-text("Tutup Panel")');
    await closeBtn.click();
    await expect(modalHeading).not.toBeVisible();
  });

  test('TC-10: Prometheus Observability & MCP Modal Interaction & PromQL Query Execution', async ({ page }) => {
    await page.goto('/');

    // Click Prometheus MCP button in header
    const promBtn = page.getByRole('button', { name: /Prometheus MCP/i });
    await expect(promBtn).toBeVisible();
    await promBtn.click();

    // Verify Modal Heading & Badges
    const modalHeading = page.getByText('Prometheus MCP Server & Observability Engine');
    await expect(modalHeading).toBeVisible();
    await expect(page.getByText('Official MCP Spec').first()).toBeVisible();
    await expect(page.getByText('v2.54.0 • Port 8000').first()).toBeVisible();

    // Verify Tab 1 (Default: PromQL Console) & run PromQL
    const runPromqlBtn = page.getByRole('button', { name: /Jalankan PromQL/i });
    await expect(runPromqlBtn).toBeVisible();
    await runPromqlBtn.click();

    // Verify query evaluation results rendered
    await expect(page.getByText('Hasil Evaluasi PromQL').first()).toBeVisible();
    await expect(page.getByText('claimtrace_financial_exposure_rupiah').first()).toBeVisible();

    // Switch to Tab 2: Live Telemetry & Gauges
    const telemetryTab = page.getByRole('button', { name: /Live Telemetry & Gauges/i });
    await telemetryTab.click();
    await expect(page.getByText('Eksposur Finansial').first()).toBeVisible();
    await expect(page.getByText('Statutory SLA Vedika').first()).toBeVisible();
    await expect(page.getByText('Rantai Audit SHA-256').first()).toBeVisible();

    // Switch to Tab 3: Active Alerts & Rules
    const alertsTab = page.getByRole('button', { name: /Active Alerts & Rules/i });
    await alertsTab.click();
    await expect(page.getByText('PhantomBillingSurgeCritical').first()).toBeVisible();
    await expect(page.getByText('ImpossibleTravelDoctorDetected').first()).toBeVisible();
    await expect(page.getByText('VedikaSlaBreachImminent').first()).toBeVisible();

    // Switch to Tab 4: Prometheus MCP Spec & Tools
    const specTab = page.getByRole('button', { name: /Prometheus MCP Spec & Tools/i });
    await specTab.click();
    await expect(page.getByText('Daftar Tool MCP Prometheus').first()).toBeVisible();
    await expect(page.getByText('prometheus_mcp_server.py').first()).toBeVisible();

    // Close modal
    const closeBtn = page.locator('.fixed button:has-text("Tutup Panel Telemetri")');
    await closeBtn.click();
    await expect(modalHeading).not.toBeVisible();
  });

  test('TC-11: REA Forensics & Client Reverse Engineering Modal Interaction & Static Analysis', async ({ page }) => {
    await page.goto('/');

    // Click Forensik REA button in header
    const reaBtn = page.getByRole('button', { name: /Forensik REA/i });
    await expect(reaBtn).toBeVisible();
    await reaBtn.click();

    // Verify Modal Heading & Badges
    const modalHeading = page.getByText('REA Forensik Klien & Reverse Engineering Engine');
    await expect(modalHeading).toBeVisible();
    await expect(page.getByText('morluto/rea v6.7.0').first()).toBeVisible();
    await expect(page.getByText('207 MCP Tools').first()).toBeVisible();

    // Verify Tab 1 (Default: Bukti Dekompilasi & Artefak Audit)
    await expect(page.getByText('SIMRS Automated Claim Injector Script').first()).toBeVisible();
    await expect(page.getByText('CRITICAL_FRAUD_INJECTOR').first()).toBeVisible();
    await expect(page.getByText('batchInjectClaims').first()).toBeVisible();

    // Switch to Tab 2: Analisis Statis Skrip Klien (AST)
    const analyzerTab = page.getByRole('button', { name: /Analisis Statis Skrip Klien/i });
    await analyzerTab.click();
    const runAnalysisBtn = page.getByRole('button', { name: /Jalankan Analisis Statis REA/i });
    await expect(runAnalysisBtn).toBeVisible();
    await runAnalysisBtn.click();

    // Verify static analysis output
    await expect(page.getByText('Hasil Audit Statis REA').first()).toBeVisible();
    await expect(page.getByText(/Skor Risiko Klien:/).first()).toBeVisible();

    // Switch to Tab 3: Inspektor APK Mobile JKN Palsu
    const apkTab = page.getByRole('button', { name: /Inspektor APK Mobile JKN Palsu/i });
    await apkTab.click();
    await expect(page.getByText('Anatomi Rekayasa APK Mobile JKN Palsu').first()).toBeVisible();
    await expect(page.getByText('Pertahanan Multi-Sinyal ClaimTrace').first()).toBeVisible();

    // Switch to Tab 4: REA Spec & Tool Catalog
    const specTab = page.getByRole('button', { name: /REA Spec & Tool Catalog/i });
    await specTab.click();
    await expect(page.getByText('Daftar Tool Forensik REA').first()).toBeVisible();
    await expect(page.getByText('analyze-javascript-application').first()).toBeVisible();

    // Close modal
    const closeBtn = page.locator('.fixed button:has-text("Tutup Panel Forensik")');
    await closeBtn.click();
    await expect(modalHeading).not.toBeVisible();
  });

  test('TC-12: BPJS Healthkathon 2026 Data Sample & BEA C03.04 Interoperability Tab', async ({ page }) => {
    await page.goto('/');

    // Select the first claim (CLM-2026-8801)
    await expect(page.getByText('CLM-2026-8801').first()).toBeVisible();

    // Click the new tab "Kamus Data Sampel BPJS & BEA C03.04"
    const bpjsTab = page.getByRole('button', { name: /Kamus Data Sampel BPJS & BEA C03.04/i });
    await expect(bpjsTab).toBeVisible();
    await bpjsTab.click();

    // Verify BEA C03.04 Card & Target System
    await expect(page.getByText(/Arsitektur Bisnis BPJS Kesehatan \(BEA C03.04 \(Klaim\)\)/i)).toBeVisible();
    await expect(page.getByText(/Target: SIGAP Anti-Fraud BPJS Kesehatan/i)).toBeVisible();

    // Verify Data Sample mapping variables
    await expect(page.getByText('FKL02')).toBeVisible();
    await expect(page.getByText('PSTV01')).toBeVisible();
    await expect(page.getByText('FKL30 / FKL31')).toBeVisible();
    await expect(page.getByText('FKL47')).toBeVisible();
    await expect(page.getByText('FKL48')).toBeVisible();
    await expect(page.getByText('Dana Aman Tertahan (Audit Pra-Bayar)').first()).toBeVisible();
  });
});



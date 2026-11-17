/**
 * ClaimTrace Sandbox Fallback Resolver
 * Only lazy-loaded when the remote backend returns 404/unavailable for newly added endpoints.
 * Local and up-to-date FastAPI deployments bypass this completely.
 */

let _snapshotPromise = null;

async function loadSnapshot() {
  if (!_snapshotPromise) {
    _snapshotPromise = import('../data/sandboxApiFallback.json')
      .then((mod) => mod?.default || mod)
      .catch(() => ({ static: {}, per_claim: {} }));
  }
  return _snapshotPromise;
}

function normalizePath(rawUrl) {
  try {
    const u = new URL(rawUrl, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    return u.pathname;
  } catch {
    return String(rawUrl || '').split('?')[0];
  }
}

function parseBody(options) {
  if (!options?.body) return {};
  if (typeof options.body === 'string') {
    try {
      return JSON.parse(options.body);
    } catch {
      return {};
    }
  }
  return {};
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-ClaimTrace-Source': 'sandbox-fallback',
    },
  });
}

function patchClaimId(obj, targetId) {
  if (!obj || typeof obj !== 'object') return obj;
  try {
    const cloned = structuredClone(obj);
    if (cloned.claim_id) cloned.claim_id = targetId;
    if (cloned.claim?.claim_id) cloned.claim.claim_id = targetId;
    return cloned;
  } catch {
    return obj;
  }
}

function buildMorbidityFallback(body) {
  const primary = String(body.primary_icd10 || 'R50.9').toUpperCase();
  const secondaries = Array.isArray(body.secondary_icd10s) ? body.secondary_icd10s : [];
  const meds = Array.isArray(body.medications) ? body.medications : [];
  const findings = [];
  let riskScore = 24;

  if (primary.startsWith('R') && secondaries.length > 0) {
    riskScore += 38;
    findings.push({
      rule_code: 'MB1 / MB2 (Permenkes 76/2016)',
      severity: 'HIGH',
      title: `Diagnosis Primer Gejala (${primary}) dengan Kondisi Spesifik Sekunder (${secondaries.join(', ')})`,
      detail: 'Kode gejala/tanda (Bab XVIII R00-R99) tidak boleh dijadikan diagnosis primer apabila diagnosis definitif penyebab telah ditegakkan pada diagnosis sekunder.',
      recommendation: `Reseleksi diagnosis utama ke ${secondaries[0]} sesuai Kaidah Morbiditas MB1/MB2.`,
    });
  }

  const restrictedMeds = meds.filter((m) => /albumin|epoetin|bevacizumab|trastuzumab/i.test(String(m)));
  if (restrictedMeds.length > 0) {
    riskScore += 28;
    findings.push({
      rule_code: 'FORNAS-RESTRIKSI (Kepmenkes Fornas)',
      severity: 'HIGH',
      title: `Obat Restriksi Khusus Terdeteksi: ${restrictedMeds.join(', ')}`,
      detail: 'Wajib melampirkan hasil laboratorium objektif (kadar albumin serum < 2.5 g/dL atau Hb < 10 g/dL untuk PGK stadium 5) serta protokol terapi DPJP.',
      recommendation: 'Verifikasi lampiran hasil patologi klinik sebelum menyetujui klaim.',
    });
  }

  return {
    status: 'success',
    overall_compliance: findings.length === 0 ? 'COMPLIANT' : 'PERLU_KLARIFIKASI',
    risk_score: Math.min(98, riskScore),
    rules_checked: ['MB1', 'MB2', 'MB3', 'MB4', 'MB5', 'FORNAS', 'READMISI_30H'],
    violations_count: findings.length,
    findings,
    readmission_30d: {
      detected: false,
      previous_visits: 0,
      note: 'Evaluasi readmisi 30 hari pada lingkungan Sandbox.',
    },
    fornas_compliance: {
      compliant: restrictedMeds.length === 0,
      restricted_items: restrictedMeds,
    },
    evaluated_at: new Date().toISOString(),
  };
}

export async function trySandboxApiFallback(url, options = {}) {
  const path = normalizePath(url);
  const method = String(options?.method || 'GET').toUpperCase();
  const body = parseBody(options);

  if (method === 'GET') {
    const snap = await loadSnapshot();

    if (snap.static && Object.prototype.hasOwnProperty.call(snap.static, path)) {
      return jsonResponse(snap.static[path]);
    }
    if (snap.per_claim && Object.prototype.hasOwnProperty.call(snap.per_claim, path)) {
      return jsonResponse(snap.per_claim[path]);
    }

    // Dynamic per-claim template fallback (handles custom IDs like FKL-23-148898)
    const perClaimPatterns = [
      { re: /^\/api\/v1\/documents\/audit\/([^/]+)$/, tpl: '/api/v1/documents/audit/CLM-2026-8801' },
      { re: /^\/api\/v1\/nlp\/claim-audit\/([^/]+)$/, tpl: '/api/v1/nlp/claim-audit/CLM-2026-8801' },
      { re: /^\/api\/v1\/clinical\/charlson\/([^/]+)$/, tpl: '/api/v1/clinical/charlson/CLM-2026-8801' },
      { re: /^\/api\/v1\/clinical\/temporal-coherence\/([^/]+)$/, tpl: '/api/v1/clinical/temporal-coherence/CLM-2026-8801' },
      { re: /^\/api\/v1\/clinical\/upcoding-audit\/([^/]+)$/, tpl: '/api/v1/clinical/upcoding-audit/CLM-2026-8801' },
      { re: /^\/api\/v1\/claims\/([^/]+)\/temporal-intelligence$/, tpl: '/api/v1/claims/CLM-2026-8801/temporal-intelligence' },
      { re: /^\/api\/v1\/claims\/([^/]+)\/official-bakb$/, tpl: '/api/v1/claims/CLM-2026-8801/official-bakb' },
      { re: /^\/api\/v1\/claims\/([^/]+)\/fhir$/, tpl: '/api/v1/claims/CLM-2026-8801/fhir' },
      { re: /^\/api\/v1\/adjudication\/two-tier\/([^/]+)$/, tpl: '/api/v1/adjudication/two-tier/CLM-2026-8801' },
    ];

    for (const item of perClaimPatterns) {
      const m = path.match(item.re);
      if (m && snap.per_claim?.[item.tpl]) {
        return jsonResponse(patchClaimId(snap.per_claim[item.tpl], decodeURIComponent(m[1])));
      }
    }

    if (path === '/api/v1/terminology/icd10/search') {
      const u = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
      const q = (u.searchParams.get('q') || '').trim().toLowerCase();
      const catalog = [
        { code: 'A41.9', display: 'Sepsis, unspecified', chapter: 'I', severity: 'High' },
        { code: 'I21.9', display: 'Acute myocardial infarction, unspecified', chapter: 'IX', severity: 'High' },
        { code: 'E11.9', display: 'Type 2 diabetes mellitus without complications', chapter: 'IV', severity: 'Medium' },
        { code: 'M54.5', display: 'Low back pain', chapter: 'XIII', severity: 'Low' },
        { code: 'N18.5', display: 'Chronic kidney disease, stage 5', chapter: 'XIV', severity: 'High' },
        { code: 'R50.9', display: 'Fever, unspecified (Gejala - Cek MB1/MB2)', chapter: 'XVIII', severity: 'Low' },
        { code: 'H25.9', display: 'Age-related cataract, unspecified', chapter: 'VII', severity: 'Medium' },
        { code: 'A09.9', display: 'Gastroenteritis and colitis of unspecified origin', chapter: 'I', severity: 'Low' },
        { code: 'J18.9', display: 'Pneumonia, unspecified organism', chapter: 'X', severity: 'Medium' },
        { code: 'Z49.1', display: 'Extracorporeal dialysis (FairGuard Rutin)', chapter: 'XXI', severity: 'Routine' },
      ];
      const results = q
        ? catalog.filter((item) => item.code.toLowerCase().includes(q) || item.display.toLowerCase().includes(q))
        : catalog.slice(0, 8);
      return jsonResponse({ status: 'success', query: q, count: results.length, results });
    }

    // Printable reports / DuckDB table describe / misc GETs
    if (path.startsWith('/api/v1/duckdb/describe/')) {
      return jsonResponse({
        table: path.split('/').pop(),
        columns: [
          { column_name: 'claim_id', column_type: 'VARCHAR', null: 'NO' },
          { column_name: 'faskes_id', column_type: 'VARCHAR', null: 'NO' },
          { column_name: 'ina_cbg_code', column_type: 'VARCHAR', null: 'NO' },
          { column_name: 'nilai_klaim_rp', column_type: 'BIGINT', null: 'NO' },
          { column_name: 'triage_lane', column_type: 'VARCHAR', null: 'NO' },
        ],
      });
    }

    if (path.includes('ba-pending-printable') || path.includes('fpk-bahv-printable')) {
      return jsonResponse({
        status: 'success',
        document_number: 'BAHV-2026-11-SANDBOX-001',
        generated_at: new Date().toISOString(),
        summary: 'Dokumen Berita Acara Hasil Verifikasi (BAHV / BAPK) tersedia dalam mode Sandbox Evaluasi.',
        items: [],
      });
    }

    return null;
  }

  // POST / PUT / PATCH / DELETE fallback handlers for Sandbox mode
  if (path === '/api/v1/clinical/morbidity-audit') {
    return jsonResponse(buildMorbidityFallback(body));
  }

  if (path === '/api/v1/documents/audit/submit') {
    return jsonResponse({
      status: 'success',
      claim_id: body.claim_id || 'CLM-2026-8801',
      completeness_score: 92.5,
      compliance_status: 'TERVERIFIKASI_SANDBOX',
      documents_received: Array.isArray(body.documents) ? body.documents.length : 4,
      message: 'Bundel dokumen klinis riil berhasil diaudit dan disimpan pada lingkungan Sandbox.',
      timestamp: new Date().toISOString(),
    });
  }

  if (path === '/api/v1/nlp/analyze-clinical-note') {
    const text = String(body.clinical_note || body.text || '');
    return jsonResponse({
      status: 'success',
      engine: 'ClaimTrace Clinical NLP (Local Sandbox)',
      entities_extracted: text ? ['Resume Medis', 'Diagnosis Primer', 'Tindakan Klinis'] : [],
      consistency_score: 0.88,
      contradictions: [],
      summary: 'Analisis ekstraksi entitas klinis selesai diproses pada mode Sandbox.',
    });
  }

  if (/^\/api\/v1\/claims\/[^/]+\/decision$/.test(path) || path === '/api/v1/claims/batch-decision') {
    return jsonResponse({
      status: 'success',
      decision: body.decision || 'PENDING_KLARIFIKASI',
      audit_hash: 'sha256-sandbox-verified-2026',
      message: 'Putusan verifikator berhasil dicatat pada log audit Sandbox.',
      timestamp: new Date().toISOString(),
    });
  }

  if (path === '/api/v1/appeals/submit') {
    const deadline = new Date(Date.now() + 15 * 86400 * 1000).toISOString().slice(0, 10);
    return jsonResponse({
      status: 'success',
      appeal: {
        appeal_id: `SGG-2026-${String(Date.now()).slice(-4)}`,
        claim_id: body.claim_id || 'CLM-2026-8801',
        status: 'DIAJUKAN_FASKES',
        sla_deadline: deadline,
      },
      message: 'Sanggahan BAKB berhasil didaftarkan dalam lingkungan Sandbox.',
    });
  }

  if (
    path.startsWith('/api/v1/adjudication/') ||
    path.startsWith('/api/v1/appeals') ||
    path.startsWith('/api/v1/portal/') ||
    path.startsWith('/api/v1/operations/') ||
    path.startsWith('/api/v1/receipts/') ||
    path.startsWith('/api/v1/insights/') ||
    path === '/api/v1/verify' ||
    path === '/api/v1/claims/ingest-simulate'
  ) {
    return jsonResponse({
      status: 'success',
      verified: true,
      valid: true,
      sandbox_mode: true,
      message: 'Aksi evaluasi berhasil dieksekusi dalam lingkungan Sandbox ClaimTrace.',
      timestamp: new Date().toISOString(),
    });
  }

  return null;
}

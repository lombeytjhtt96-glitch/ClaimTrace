import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Activity,
  Archive,
  CheckCircle2,
  Database,
  ExternalLink,
  FileCheck2,
  HardDrive,
  KeyRound,
  Mail,
  Play,
  RefreshCw,
  Server,
  Shield,
  Zap,
} from 'lucide-react';
import { API_BASE_URL, authFetch, cachedAuthGetJson } from '../../services/apiConfig';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ClaimTraceDataTable } from '../ui/data-table';

const casbinSchema = z.object({
  role: z.enum(['ADMIN', 'KEPALA_CABANG', 'VERIFICATOR_MEDIS', 'ANALYST']),
  resource: z.string().min(1, 'Path resource wajib diisi').startsWith('/', 'Harus diawali tanda "/"'),
  action: z.enum(['GET', 'POST', 'PATCH', 'PUT', 'DELETE']),
});

const mailSchema = z.object({
  recipient: z.string().email('Alamat email tujuan tidak valid'),
  subject: z.string().min(4, 'Subjek minimal 4 karakter'),
  template_name: z.enum(['clarification_notice', 'backup_report', 'audit_alert']),
});

export function InfrastructureConsoleView() {
  const qc = useQueryClient();
  const [notice, setNotice] = useState(null);
  const [casbinResult, setCasbinResult] = useState(null);
  const [pdfSignResult, setPdfSignResult] = useState(null);

  const stackQuery = useQuery({
    queryKey: ['system', 'enterprise-stack'],
    staleTime: 10_000,
    refetchInterval: 20_000,
    queryFn: () => cachedAuthGetJson(`${API_BASE_URL}/api/v1/system/enterprise-stack/status`, { force: true }),
  });

  const jobsQuery = useQuery({
    queryKey: ['jobs', { limit: 20 }],
    staleTime: 5_000,
    refetchInterval: 10_000,
    queryFn: () => cachedAuthGetJson(`${API_BASE_URL}/api/v1/jobs?limit=20`, { force: true }),
  });

  const runBackupMutation = useMutation({
    mutationFn: async () => {
      const res = await authFetch(`${API_BASE_URL}/api/v1/system/backups/run`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);
      return data;
    },
    onSuccess: (data) => {
      setNotice(`Backup terverifikasi selesai: ${data?.backup?.archive_name} (${data?.backup?.size_bytes} bytes).`);
      qc.invalidateQueries({ queryKey: ['system', 'enterprise-stack'] });
    },
    onError: (err) => setNotice(`Gagal menjalankan backup: ${err.message}`),
  });

  const enqueueJobMutation = useMutation({
    mutationFn: async (jobType) => {
      const res = await authFetch(`${API_BASE_URL}/api/v1/jobs/enqueue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_type: jobType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);
      return data;
    },
    onSuccess: (data) => {
      setNotice(`Job ARQ ${data.job_id} dikirim via ${data.dispatch_mode}.`);
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['system', 'enterprise-stack'] });
    },
    onError: (err) => setNotice(`Gagal mengirim job ARQ: ${err.message}`),
  });

  const signPdfMutation = useMutation({
    mutationFn: async (claimId = 'CLM-2026-8801') => {
      const res = await authFetch(`${API_BASE_URL}/api/v1/reports/bahv/${claimId}/sign-and-verify`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);
      return data;
    },
    onSuccess: (data) => {
      setPdfSignResult(data);
      setNotice(`PDF BAHV ${data.claim_id} ditandatangani X.509 & diverifikasi (${data.verification?.valid ? 'VALID' : 'CHECK'}).`);
      qc.invalidateQueries({ queryKey: ['system', 'enterprise-stack'] });
    },
    onError: (err) => setNotice(`Gagal menandatangani PDF X.509: ${err.message}`),
  });

  const casbinForm = useForm({
    resolver: zodResolver(casbinSchema),
    defaultValues: {
      role: 'KEPALA_CABANG',
      resource: '/api/v1/system/backups/run',
      action: 'POST',
    },
  });

  const mailForm = useForm({
    resolver: zodResolver(mailSchema),
    defaultValues: {
      recipient: 'casemix.mitrahusada@example.org',
      subject: 'Undangan Klarifikasi FKRTL · CLM-2026-8801',
      template_name: 'clarification_notice',
    },
  });

  const onCheckCasbin = async (values) => {
    const res = await authFetch(`${API_BASE_URL}/api/v1/security/casbin/enforce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => ({}));
    setCasbinResult(data);
  };

  const onSendMail = async (values) => {
    const res = await authFetch(`${API_BASE_URL}/api/v1/system/mail/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipients: [values.recipient],
        subject: values.subject,
        template_name: values.template_name,
        context: {},
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setNotice(`FastAPI-Mail berhasil merender ${data?.mail?.template_name} (${data?.mail?.mail_id}).`);
      qc.invalidateQueries({ queryKey: ['system', 'enterprise-stack'] });
    } else {
      setNotice(`Gagal mengirim email: ${data?.detail || res.status}`);
    }
  };

  const jobColumns = useMemo(
    () => [
      { accessorKey: 'job_id', header: 'Job ID', cell: ({ getValue }) => <span className="font-mono text-xs">{getValue()}</span> },
      { accessorKey: 'job_type', header: 'Jenis Tugas' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const val = String(getValue() || '');
          const variant = val === 'complete' || val === 'completed' ? 'success' : val === 'failed' ? 'destructive' : 'warning';
          return <Badge variant={variant}>{val.toUpperCase()}</Badge>;
        },
      },
      { accessorKey: 'dispatch_mode', header: 'Mode Eksekusi', cell: ({ getValue }) => <span className="text-xs text-slate-600">{getValue()}</span> },
      { accessorKey: 'requested_by', header: 'Pemicu' },
    ],
    [],
  );

  const stack = stackQuery.data || {};
  const pg = stack.postgres || {};
  const redis = stack.redis || {};
  const backup = stack.scheduled_backup || {};
  const s3 = stack.object_storage || {};
  const obs = stack.observability || {};
  const kc = stack.keycloak_oidc || {};
  const pdfSigner = stack.pdf_signer || {};
  const jobs = jobsQuery.data?.jobs || [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Konsol Infrastruktur &amp; Tata Kelola Enterprise</h2>
          <p className="text-xs text-slate-500">
            Pemantauan langsung PostgreSQL + Alembic, Redis + ARQ, MinIO S3, Prometheus/OpenTelemetry, Scheduled Backup, PyCasbin RBAC, Keycloak OIDC, dan Tanda Tangan X.509.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => stackQuery.refetch()} disabled={stackQuery.isFetching}>
            <RefreshCw className={`h-3.5 w-3.5 ${stackQuery.isFetching ? 'animate-spin' : ''}`} />
            Muat Ulang
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/sqladmin/" target="_blank" rel="noreferrer">
              <Database className="h-3.5 w-3.5" />
              SQLAdmin
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/admin-portal" target="_blank" rel="noreferrer">
              <Server className="h-3.5 w-3.5" />
              Admin Portal
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
          <Button size="sm" onClick={() => runBackupMutation.mutate()} disabled={runBackupMutation.isPending}>
            <Archive className="h-3.5 w-3.5" />
            {runBackupMutation.isPending ? 'Membuat Backup...' : 'Jalankan Backup Sekarang'}
          </Button>
        </div>
      </div>

      {notice && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-900">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            {notice}
          </span>
          <button type="button" onClick={() => setNotice(null)} className="text-emerald-700 hover:underline">
            Tutup
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Database className="h-4 w-4 text-emerald-700" />
                PostgreSQL + Alembic
              </CardTitle>
              <Badge variant={pg.postgres_connected ? 'success' : 'warning'}>
                {pg.postgres_connected ? 'ONLINE' : 'FALLBACK'}
              </Badge>
            </div>
            <CardDescription>{pg.database_name || 'claimtrace_db'}</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-slate-600 space-y-1">
            <div>Revisi Alembic: <span className="font-mono font-semibold text-slate-900">{stack.alembic?.current_revision || '-'}</span></div>
            <div>Claims: <strong>{pg.tables?.claims ?? 0}</strong> · Ledger: <strong>{pg.tables?.audit_ledger_blocks ?? 0}</strong> · Jobs: <strong>{pg.tables?.async_job_runs ?? 0}</strong></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-600" />
                Redis + ARQ Worker
              </CardTitle>
              <Badge variant={redis.worker_active ? 'success' : 'warning'}>
                {redis.worker_active ? 'WORKER AKTIF' : 'STANDBY'}
              </Badge>
            </div>
            <CardDescription>Queue: {redis.queue_name || 'claimtrace:arq'}</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-slate-600 space-y-1">
            <div>APScheduler: <strong>{stack.scheduler?.apscheduler_jobs_count ?? 0}</strong> · ARQ Cron: <strong>{stack.scheduler?.arq_cron_jobs_count ?? 0}</strong></div>
            <div>Keys Redis: <strong>{redis.keyspace_keys ?? 0}</strong> · SlowAPI: <strong>{stack.slowapi?.storage_backend || 'memory'}</strong></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <HardDrive className="h-4 w-4 text-sky-700" />
                MinIO S3 &amp; Backup
              </CardTitle>
              <Badge variant="success">{backup.total_archives ?? 0} Arsip</Badge>
            </div>
            <CardDescription>Mode: {s3.mode || 'local_s3_mirror'}</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-slate-600 space-y-1">
            <div>Total Objek S3: <strong>{s3.total_objects ?? 0}</strong></div>
            <div>Jadwal: <span className="font-mono">{backup.schedule || '02:00 WIB'}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-indigo-700" />
                Tracing, SSO &amp; X.509
              </CardTitle>
              <Badge variant="success">OTEL + BSrE</Badge>
            </div>
            <CardDescription>Realm: {kc.realm || 'claimtrace-jkn'}</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-slate-600 space-y-1">
            <div>OTel Spans: <strong>{obs.total_recorded_spans ?? 0}</strong> · JSON Logs: <strong>{obs.total_recorded_logs ?? 0}</strong></div>
            <div>Signer: <span className="font-mono text-[11px]">{pdfSigner.engine || 'pyhanko-x509'}</span></div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="jobs" className="w-full">
        <TabsList>
          <TabsTrigger value="jobs">Antrean ARQ &amp; Cron (TanStack Table)</TabsTrigger>
          <TabsTrigger value="governance">PyCasbin RBAC &amp; FastAPI-Mail (Zod)</TabsTrigger>
          <TabsTrigger value="security">X.509 PDF Signer &amp; Keycloak OIDC</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Riwayat Tugas Asinkron Redis + ARQ</CardTitle>
                <CardDescription>Data langsung dari Redis &amp; write-through PostgreSQL `async_job_runs`.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => enqueueJobMutation.mutate('audit_integrity_check')} disabled={enqueueJobMutation.isPending}>
                  <Play className="h-3.5 w-3.5" />
                  Audit SHA-256
                </Button>
                <Button size="sm" variant="outline" onClick={() => enqueueJobMutation.mutate('analytics_refresh')} disabled={enqueueJobMutation.isPending}>
                  <Play className="h-3.5 w-3.5" />
                  Refresh Analitik
                </Button>
                <Button size="sm" onClick={() => enqueueJobMutation.mutate('scheduled_backup')} disabled={enqueueJobMutation.isPending}>
                  <Play className="h-3.5 w-3.5" />
                  Antrekan Backup ARQ
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ClaimTraceDataTable
                columns={jobColumns}
                data={jobs}
                searchPlaceholder="Cari Job ID, jenis tugas, atau status..."
                initialPageSize={6}
                emptyMessage="Belum ada riwayat tugas asinkron."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="governance">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-emerald-700" />
                  Simulator Kebijakan PyCasbin RBAC (React Hook Form + Zod)
                </CardTitle>
                <CardDescription>Uji otorisasi peran hierarkis BPJS Kesehatan secara langsung.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={casbinForm.handleSubmit(onCheckCasbin)} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">Peran (Subject)</label>
                    <select
                      {...casbinForm.register('role')}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="KEPALA_CABANG">KEPALA_CABANG</option>
                      <option value="VERIFICATOR_MEDIS">VERIFICATOR_MEDIS</option>
                      <option value="ANALYST">ANALYST</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">Resource Path</label>
                    <Input {...casbinForm.register('resource')} placeholder="/api/v1/system/backups/run" />
                    {casbinForm.formState.errors.resource && (
                      <p className="mt-1 text-xs text-rose-600">{casbinForm.formState.errors.resource.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">Action (HTTP Method)</label>
                    <select
                      {...casbinForm.register('action')}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PATCH">PATCH</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                  <Button type="submit" size="sm">Evaluasi Kebijakan Casbin</Button>
                </form>

                {casbinResult && (
                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Hasil Evaluasi:</span>
                      <Badge variant={casbinResult.allowed ? 'success' : 'destructive'}>
                        {casbinResult.allowed ? 'DIIZINKAN (ALLOW)' : 'DITOLAK (DENY)'}
                      </Badge>
                    </div>
                    <div className="mt-1 text-slate-600">
                      Pewarisan peran: {(casbinResult.inherited_roles || []).join(', ') || 'Tidak ada'}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-sky-700" />
                  Kirim Notifikasi FastAPI-Mail + Jinja2 (React Hook Form + Zod)
                </CardTitle>
                <CardDescription>Render template HTML dinas resmi dan catat ke outbox audit.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={mailForm.handleSubmit(onSendMail)} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">Email Penerima</label>
                    <Input {...mailForm.register('recipient')} placeholder="casemix@faskes.example.org" />
                    {mailForm.formState.errors.recipient && (
                      <p className="mt-1 text-xs text-rose-600">{mailForm.formState.errors.recipient.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">Subjek</label>
                    <Input {...mailForm.register('subject')} />
                    {mailForm.formState.errors.subject && (
                      <p className="mt-1 text-xs text-rose-600">{mailForm.formState.errors.subject.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">Template Jinja2</label>
                    <select
                      {...mailForm.register('template_name')}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    >
                      <option value="clarification_notice">clarification_notice.html (Undangan Klarifikasi)</option>
                      <option value="backup_report">backup_report.html (Laporan Backup SHA-256)</option>
                      <option value="audit_alert">audit_alert.html (Peringatan Forensik)</option>
                    </select>
                  </div>
                  <Button type="submit" size="sm">Render &amp; Kirim Email</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileCheck2 className="h-4 w-4 text-emerald-700" />
                  Tanda Tangan Digital PDF X.509 / BSrE (pyHanko)
                </CardTitle>
                <CardDescription>{pdfSigner.standard || 'PAdES-Compatible RSA-2048 SHA-256'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-700">
                <div>Subjek Sertifikat: <span className="font-mono">{pdfSigner.subject || '-'}</span></div>
                <div>Fingerprint SHA-256: <span className="font-mono break-all">{pdfSigner.fingerprint_sha256 || '-'}</span></div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => signPdfMutation.mutate('CLM-2026-8801')} disabled={signPdfMutation.isPending}>
                    <FileCheck2 className="h-3.5 w-3.5" />
                    {signPdfMutation.isPending ? 'Menandatangani...' : 'Tanda Tangani & Verifikasi BAHV 8801'}
                  </Button>
                </div>
                {pdfSignResult && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-1">
                    <div>Status Kriptografi: <strong>{pdfSignResult.verification?.valid ? 'VALID & INTACT' : 'PERLU CEK'}</strong></div>
                    <div>Disimpan di S3: <span className="font-mono">{pdfSignResult.stored_object?.bucket}/{pdfSignResult.stored_object?.object_name}</span></div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <KeyRound className="h-4 w-4 text-indigo-700" />
                  Keycloak OIDC / SAML 2.0 Enterprise SSO
                </CardTitle>
                <CardDescription>Realm: {kc.realm || 'claimtrace-jkn'} · PKCE {kc.pkce_method || 'S256'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-slate-700">
                <div>Mode Aktif: <Badge variant="outline">{kc.mode || 'local_sso_mfa_with_oidc_ready'}</Badge></div>
                <div>Issuer: <span className="font-mono break-all">{kc.endpoints?.issuer || '-'}</span></div>
                <div>Discovery: <span className="font-mono break-all">{kc.endpoints?.discovery_url || '-'}</span></div>
                <div>Realm Export: <span className="font-mono">{kc.realm_export_file || 'infra/keycloak/claimtrace-realm.json'}</span></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default InfrastructureConsoleView;

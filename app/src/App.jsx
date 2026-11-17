import React, { useState, useEffect, useRef, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { StatsigProvider, useClientAsyncInit } from '@statsig/react-bindings';
import { StatsigAutoCapturePlugin } from '@statsig/web-analytics';
import { StatsigSessionReplayPlugin } from '@statsig/session-replay';
import { GrowthBookProvider } from '@growthbook/growthbook-react';
import { growthbook } from './services/growthbook';
import lazyWithRetry from './utils/lazyWithRetry';
import { motion, AnimatePresence } from 'motion/react';
import {
  API_BASE_URL,
  authFetch,
  getCachedJsonSync,
  cachedAuthGetJson,
  prefetchDashboardHotEndpoints,
  getStoredAuthToken,
  hasValidSessionStorage,
  clearSessionStorage,
  getDeviceFingerprint,
  saveAuthenticatedSession,
} from './services/apiConfig';
import { Analytics } from '@vercel/analytics/react';
import {
  Bell, Search, Shield, ShieldCheck, CheckCircle, XCircle,
  ChevronRight, ArrowRight, Activity, FileText, User,
  HelpCircle, Home, Smartphone, Clock, Stethoscope, ChevronLeft, Info,
  Printer, QrCode, CreditCard, ListFilter, Database, ShieldAlert, Key, LayoutDashboard, Building2,
  ChevronDown, LogOut, PanelLeftClose, PanelLeft, RotateCcw, Settings, X,
  Briefcase, Zap, Flag, Calendar, Users, MessageSquare, ClipboardList,
  Sparkles, Sun, Moon, FileCheck2
} from 'lucide-react';

// Auth Components (Eager Login Gate on entry; SignOut lazy-loaded)
import SignInPage from './components/Auth/SignInPage';
const SignOutPage = lazyWithRetry(() => import('./components/Auth/SignOutPage'));

// Primary Cockpit Modules (Lazy-loaded for sub-second Landing LCP)
const ExecutiveHub = lazyWithRetry(() => import('./components/Dashboard/ExecutiveHub'));
const TriageOverview = lazyWithRetry(() => import('./components/Dashboard/TriageOverview'));
const CaseInvestigation = lazyWithRetry(() => import('./components/Dashboard/CaseInvestigation'));
const HealthAIChatWidget = lazyWithRetry(() => import('./components/Dashboard/HealthAIChatWidget'));

// Mobile JKN Screens (Lazy-loaded on demand)
const MoreMenuScreen = lazyWithRetry(() => import('./components/MobileJKN/MoreMenuScreen'));
const AntreanScreen = lazyWithRetry(() => import('./components/MobileJKN/AntreanScreen'));
const RiwayatPelayananScreen = lazyWithRetry(() => import('./components/MobileJKN/RiwayatPelayananScreen'));
const TempatTidurScreen = lazyWithRetry(() => import('./components/MobileJKN/TempatTidurScreen'));
const KonsultasiDokterScreen = lazyWithRetry(() => import('./components/MobileJKN/KonsultasiDokterScreen'));
const UbahDataScreen = lazyWithRetry(() => import('./components/MobileJKN/UbahDataScreen'));
const SkriningScreen = lazyWithRetry(() => import('./components/MobileJKN/SkriningScreen'));
const PembayaranScreen = lazyWithRetry(() => import('./components/MobileJKN/PembayaranScreen'));
const PengaduanScreen = lazyWithRetry(() => import('./components/MobileJKN/PengaduanScreen'));
const BugarScreen = lazyWithRetry(() => import('./components/MobileJKN/BugarScreen'));
const ObatScreen = lazyWithRetry(() => import('./components/MobileJKN/ObatScreen'));
import TabErrorBoundary from './components/Common/TabErrorBoundary';
import WorkspaceHubShell from './components/Common/WorkspaceHubShell';
import { verifySessionRequest } from './services/apiConfig';

// Secondary Forensic Cockpit Modules (Lazy-loaded on demand)
const EmpiricalForensics = lazyWithRetry(() => import('./components/Dashboard/EmpiricalForensics'));
const FaskesSurveillance = lazyWithRetry(() => import('./components/Dashboard/FaskesSurveillance'));
const DpjpIntelligence = lazyWithRetry(() => import('./components/Dashboard/DpjpIntelligence'));
const MobileTelemetry = lazyWithRetry(() => import('./components/Dashboard/MobileTelemetry'));
const DecisionConsole = lazyWithRetry(() => import('./components/Dashboard/DecisionConsole'));
const AuditLedger = lazyWithRetry(() => import('./components/Dashboard/AuditLedger'));
const AdminProfileView = lazyWithRetry(() => import('./components/Dashboard/AdminProfileView'));
const AdminSettingsView = lazyWithRetry(() => import('./components/Dashboard/AdminSettingsView'));
const InsightsAnalyticsView = lazyWithRetry(() => import('./components/Dashboard/InsightsAnalyticsView'));
const RetentionAnalyticsView = lazyWithRetry(() => import('./components/Dashboard/RetentionAnalyticsView'));
const CasesManagementView = lazyWithRetry(() => import('./components/Dashboard/CasesManagementView'));
const QuickTriageView = lazyWithRetry(() => import('./components/Dashboard/QuickTriageView'));
const FlaggedSessionsView = lazyWithRetry(() => import('./components/Dashboard/FlaggedSessionsView'));
const ClarificationScheduleView = lazyWithRetry(() => import('./components/Dashboard/ClarificationScheduleView'));
const ConversationsView = lazyWithRetry(() => import('./components/Dashboard/ConversationsView'));
const InterventionsView = lazyWithRetry(() => import('./components/Dashboard/InterventionsView'));
const DatabaseViewerView = lazyWithRetry(() => import('./components/Dashboard/DatabaseViewerView'));
const HealthAIChatView = lazyWithRetry(() => import('./components/Dashboard/HealthAIChatView'));
const OfficialReportsView = lazyWithRetry(() => import('./components/Dashboard/OfficialReportsView'));
const DocumentCheckerView = lazyWithRetry(() => import('./components/Dashboard/DocumentCheckerView'));
const FraudRankingView = lazyWithRetry(() => import('./components/Dashboard/FraudRankingView'));

const HUB_SUB_DEFAULTS = {
  queue: 'priority',
  investigation: 'audit',
  faskes: 'surveillance',
  empirical: 'benford',
  mobile_bridge: 'telemetry',
  official_reports: 'reports',
  settings: 'preferences',
};

const LEGACY_TAB_MAP = {
  executive: { tab: 'executive' },
  queue: { tab: 'queue', sub: 'priority' },
  quick_triage: { tab: 'queue', sub: 'quick' },
  cases_mgmt: { tab: 'queue', sub: 'files' },
  flagged_sessions: { tab: 'queue', sub: 'flagged' },
  investigation: { tab: 'investigation', sub: 'audit' },
  document_checker: { tab: 'investigation', sub: 'dokumen' },
  decision: { tab: 'decision' },
  faskes: { tab: 'faskes', sub: 'surveillance' },
  fraud_ranking: { tab: 'faskes', sub: 'ranking' },
  dpjp: { tab: 'faskes', sub: 'dpjp' },
  retention: { tab: 'faskes', sub: 'retention' },
  empirical: { tab: 'empirical', sub: 'benford' },
  insights: { tab: 'empirical', sub: 'trends' },
  database_viewer: { tab: 'empirical', sub: 'sql' },
  db_viewer: { tab: 'empirical', sub: 'sql' },
  mobile_bridge: { tab: 'mobile_bridge', sub: 'telemetry' },
  appointments: { tab: 'mobile_bridge', sub: 'schedule' },
  clarification_sched: { tab: 'mobile_bridge', sub: 'schedule' },
  conversations: { tab: 'mobile_bridge', sub: 'dialog' },
  interventions: { tab: 'mobile_bridge', sub: 'interventions' },
  official_reports: { tab: 'official_reports', sub: 'reports' },
  audit: { tab: 'official_reports', sub: 'ledger' },
  health_ai_chat: { tab: 'health_ai_chat' },
  agent_copilot: { tab: 'health_ai_chat' },
  command_center: { tab: 'queue', sub: 'files' },
  expansion_suite: { tab: 'investigation', sub: 'audit' },
  settings: { tab: 'settings', sub: 'preferences' },
  profile: { tab: 'settings', sub: 'profile' },
};

const buildMitraCaseFallback = (cId) =>
  typeof cId === 'object' && cId !== null
    ? cId
    : {
        id: cId || 'CLM-2026-10-085',
        sep: '0132R0011026V000085',
        hospital: 'RS Khusus Mitra Husada',
        hospitalType: 'FKRTL (RS Khusus Kelas C)',
        code: 'Z-3-12-0',
        description: 'Prosedur Fisioterapi / Rehabilitasi Medis Massal Pasca-Baksos',
        tariff: 'Rp 15.300.000 (85 Klaim)',
        dpjp: 'dr. Hendra, Sp.KFR',
        sipNumber: '446.1/108/DPJP/2023',
        date: '14 Okt 2026',
        batchTag: 'BAKSOS_MASSAL_OKT26',
        sampleCount: 10,
        participantCount: 10,
        deniedCount: 8,
        s1: 85,
        s2: 95,
        s3: 80,
        totalScore: 88.0,
        lane: 'red',
        status: 'AUDIT KHUSUS MERAH',
        notes: 'Klaster Baksos 85 klaim fisioterapi tanpa rujukan FKTP sah; SIP DPJP mutasi.',
        flags: ['BAKSOS MASSAL', 'SIP MUTASI'],
      };

const DPJP_CASE_OVERRIDES = {
  overcapacity_anak: {
    hospital: 'RS Ibu & Anak Kasih Bunda',
    hospitalType: 'RS Khusus (Kelas C)',
    code: 'Q-5-42-0',
    description: 'Pelayanan Spesialis Anak - Beban Pasien Harian Melampaui Batas Permenkes',
    tariff: 'Rp 27.000.000',
    dpjp: 'dr. Ratna Wulandari, Sp.A',
    sipNumber: 'SIP.503/1102/DPMPTSP/2025',
    totalScore: 78.0,
    lane: 'red',
    status: 'AUDIT OVERCAPACITY MERAH',
    notes: 'Beban harian 72 pasien/hari melampaui batas Permenkes No. 14/2021 (maks. 40 pasien/hari).',
    flags: ['OVERCAPACITY', 'BEBAN HARIAN TINGGI'],
  },
  sip_obgyn: {
    hospital: 'RS Hermina Kemayoran Jakarta',
    hospitalType: 'RS Swasta (Kelas B)',
    code: 'W-4-10-I',
    description: 'Prosedur Ginekologi - Klaim Diajukan Saat Masa Berlaku SIP Berakhir',
    tariff: 'Rp 33.600.000',
    dpjp: 'dr. Maya Kusuma, Sp.OG',
    sipNumber: 'SIP.503/3321/DPMPTSP/2021',
    totalScore: 82.0,
    lane: 'red',
    status: 'AUDIT SIP MERAH',
    notes: 'SIP dokter di faskes ini telah kadaluwarsa per Juni 2024 namun tagihan klaim tetap berjalan aktif.',
    flags: ['SIP KADALUWARSA', 'KLAIM ILEGAL'],
  },
  overcapacity_rad: {
    hospital: 'RSUPN Dr. Cipto Mangunkusumo Jakarta',
    hospitalType: 'RS Pemerintah (Kelas A - Rujukan Nasional)',
    code: 'U-3-12-0',
    description: 'Pemeriksaan Radiologi Lanjut - Beban Bacaan 65 Pasien/Hari',
    tariff: 'Rp 42.000.000',
    dpjp: 'dr. Farhan Malik, Sp.Rad',
    sipNumber: 'SIP.503/7712/DPMPTSP/2023',
    totalScore: 76.0,
    lane: 'red',
    status: 'AUDIT OVERCAPACITY MERAH',
    notes: 'Beban harian 65 ekspertise radiologi/hari melampaui ambang batas rasional Permenkes 14/2021.',
    flags: ['OVERCAPACITY', 'BEBAN RADIOLOGI TINGGI'],
  },
  geovelocity_mata: {
    hospital: 'RS Mata Solo',
    hospitalType: 'RS Khusus (Kelas B)',
    code: 'C-4-13-I',
    description: 'Operasi Phacoemulsifikasi Katarak - Geovelocity Peak Hour (98.2 km/jam)',
    tariff: 'Rp 89.000.000',
    dpjp: 'dr. Sinta Anggraini, Sp.M',
    sipNumber: 'SIP.503/8890/DPMPTSP/2022',
    totalScore: 86.0,
    lane: 'red',
    status: 'AUDIT GEOVELOCITY MERAH',
    notes: 'Anomali Geovelocity: Tercatat operasi katarak di Solo dan visite di Boyolali dalam jeda 30 menit pada jam sibuk.',
    flags: ['GEOVELOCITY ALERT', 'IMPOSSIBLE TRAVEL', 'SIP MUTASI'],
  },
};

const buildDpjpCaseFallback = (cId) => {
  const base = {
    id: cId,
    sep: `0132R0011026V${String(cId || '000001').slice(-6)}`,
    hospital: 'RSUPN Dr. Cipto Mangunkusumo Jakarta',
    hospitalType: 'FKRTL (RS Pemerintah Kelas A - Rujukan Nasional)',
    code: 'B-1-10-I',
    description: 'Prosedur Laparotomi & Tindakan Bedah Minor (Anomali Geovelocity)',
    tariff: 'Rp 59.500.000',
    dpjp: 'dr. Hendra Prasetya, Sp.B',
    sipNumber: 'SIP.503/4412/DPMPTSP/2023',
    date: '24 Okt 2026',
    batchTag: 'GEOVELOCITY_ANOMALY_OKT26',
    sampleCount: 10,
    participantCount: 10,
    deniedCount: 9,
    s1: 95,
    s2: 90,
    s3: 85,
    totalScore: 91.5,
    lane: 'red',
    status: 'AUDIT GEOVELOCITY MERAH',
    notes: 'Anomali Geovelocity Impossible Travel: DPJP tercatat operasi di Jakarta Pusat (RSCM) dan Bandung (RSHS) dalam selisih 45 menit (kecepatan mustahil 185.2 km/jam).',
    flags: ['GEOVELOCITY ALERT', 'IMPOSSIBLE TRAVEL', 'SIP EXPIRED'],
  };
  if (cId.includes('0744') || cId.includes('0751')) return { ...base, ...DPJP_CASE_OVERRIDES.overcapacity_anak };
  if (cId.includes('0612') || cId.includes('0619')) return { ...base, ...DPJP_CASE_OVERRIDES.sip_obgyn };
  if (cId.includes('0921')) return { ...base, ...DPJP_CASE_OVERRIDES.overcapacity_rad };
  if (cId.includes('1002')) return { ...base, ...DPJP_CASE_OVERRIDES.geovelocity_mata };
  return base;
};

export default function App() {
  const id = typeof userID !== 'undefined' ? userID : 'a-user';
  const { client } = useClientAsyncInit(
    'client-xuGhZIFcJXG4W5mMcIvGmf72EuWFy93Ezdbd3F9nXU6',
    { userID: id },
    {
      plugins: [
        new StatsigAutoCapturePlugin(),
        new StatsigSessionReplayPlugin({
          maskAllInputs: true,
          maskAllText: false,
          blockSelector: '.phi-protected, [data-phi], input[type="password"]',
        }),
      ],
    }
  );

  useEffect(() => {
    growthbook.init({ streaming: true }).catch((err) => {
      console.warn('[GrowthBook Init Notice]:', err?.message || err);
    });
  }, []);

  useEffect(() => {
    if (client) {
      client.logEvent('claimtrace_app_mounted', 'INIT_SUCCESS', {
        version: '1.0.0',
        environment: import.meta.env.MODE || 'production',
        regulatory_standard: 'Permenkes 26/2021',
      });
    }
  }, [client]);

  // Fail-closed initial router: NEVER opens landing or unauthenticated dashboard
  const getInitialResetToken = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token') || '';
    }
    return '';
  };

  const getInitialView = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('view') || window.location.hash.replace('#', '');
      if (v === 'reset_password') return 'reset_password';
      if (v === 'logout') return 'logout';
      if (hasValidSessionStorage()) {
        if (v === 'dashboard' || v === 'health_ai' || !v || v === 'login' || v === 'landing' || v === 'mfa') {
          return v === 'login' ? 'login' : 'dashboard';
        }
      }
    }
    return 'login';
  };

  const resolveInitialRoute = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('view');
      if (v === 'health_ai') return { tab: 'health_ai_chat', sub: undefined };
      const rawTab = params.get('tab');
      const mapped = LEGACY_TAB_MAP[rawTab];
      const explicitSub = params.get('sub') || undefined;
      if (mapped) {
        return { tab: mapped.tab, sub: explicitSub || mapped.sub };
      }
    }
    return { tab: 'executive', sub: undefined };
  };

  // Global View Router: strictly 'login' | 'reset_password' | 'logout' | 'dashboard'
  const [resetToken, setResetToken] = useState(getInitialResetToken);
  const [authView, setAuthView] = useState(getInitialView);
  const [authStatusVerified, setAuthStatusVerified] = useState(false);
  const [sessionNotice, setSessionNotice] = useState('');
  const [logoutReason, setLogoutReason] = useState('');
  const [sessionIdleSeconds, setSessionIdleSeconds] = useState(null);

  // Mode tampilan dalam Cockpit: 'dashboard' (Full Cockpit) | 'split' (Dual View HP & Cockpit) | 'mobile' (Only Phone)
  const getInitialViewMode = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const m = params.get('mode');
      if (['dashboard', 'split', 'mobile'].includes(m)) return m;
    }
    return 'dashboard';
  };
  const [viewMode, setViewMode] = useState(getInitialViewMode);

  // Consolidated 10-Module Dashboard Router + Per-Hub Sub-Tab State
  const initialRoute = resolveInitialRoute();
  const [dashboardTab, setRawDashboardTab] = useState(initialRoute.tab);
  const [hubSubTabs, setHubSubTabs] = useState(() => ({
    ...HUB_SUB_DEFAULTS,
    ...(initialRoute.sub && HUB_SUB_DEFAULTS[initialRoute.tab] ? { [initialRoute.tab]: initialRoute.sub } : {}),
  }));
  const [workflowMapOpen, setWorkflowMapOpen] = useState(false);

  const setDashboardTab = (targetId, explicitSub) => {
    const resolved = LEGACY_TAB_MAP[targetId] || { tab: 'executive' };
    setRawDashboardTab(resolved.tab);
    const nextSub = explicitSub || resolved.sub;
    if (nextSub && HUB_SUB_DEFAULTS[resolved.tab]) {
      setHubSubTabs((prev) => ({ ...prev, [resolved.tab]: nextSub }));
    }
  };

  const setHubSubTab = (hubId, subId) => {
    setHubSubTabs((prev) => ({ ...prev, [hubId]: subId }));
  };
  const [isMobileViewport, setIsMobileViewport] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 1024 : false));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 1024 : false));
  const [selectedCase, setSelectedCase] = useState(null);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 1024;
      const wasMobile = prevMobileRef.current;
      prevMobileRef.current = mobile;
      setIsMobileViewport(mobile);
      if (mobile && !wasMobile) {
        setSidebarCollapsed(true);
      } else if (!mobile && wasMobile) {
        setSidebarCollapsed(false);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Sync state to URL while enforcing fail-closed login/dashboard boundaries
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.dataset.authView = authView;
      const shouldHideBadge = authView !== 'login' && authView !== 'reset_password';
      document.querySelectorAll('.grecaptcha-badge').forEach((el) => {
        el.style.display = shouldHideBadge ? 'none' : '';
        el.style.visibility = shouldHideBadge ? 'hidden' : '';
      });
    }
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const canShowDashboardUrl =
        authView === 'dashboard' &&
        (authStatusVerified || hasValidSessionStorage());
      const safeUrlView = canShowDashboardUrl
        ? 'dashboard'
        : authView === 'reset_password'
          ? 'reset_password'
          : authView === 'logout'
            ? 'logout'
            : 'login';
      if (safeUrlView === 'login') {
        url.searchParams.delete('view');
        url.searchParams.delete('tab');
        url.searchParams.delete('sub');
        url.searchParams.delete('mode');
        url.searchParams.delete('token');
        if (url.hash === '#login') {
          url.hash = '';
        }
      } else {
        url.searchParams.set('view', safeUrlView);
        if (safeUrlView === 'dashboard') {
          url.searchParams.set('tab', dashboardTab);
          const activeSub = HUB_SUB_DEFAULTS[dashboardTab] ? hubSubTabs[dashboardTab] : null;
          if (activeSub && activeSub !== HUB_SUB_DEFAULTS[dashboardTab]) {
            url.searchParams.set('sub', activeSub);
          } else {
            url.searchParams.delete('sub');
          }
          if (viewMode !== 'dashboard') {
            url.searchParams.set('mode', viewMode);
          } else {
            url.searchParams.delete('mode');
          }
        } else {
          url.searchParams.delete('tab');
          url.searchParams.delete('sub');
          url.searchParams.delete('mode');
        }
        if (safeUrlView === 'reset_password' && resetToken) {
          url.searchParams.set('token', resetToken);
        } else {
          url.searchParams.delete('token');
        }
      }
      window.history.replaceState(null, '', url.toString());
    }
  }, [authView, dashboardTab, hubSubTabs, viewMode, authStatusVerified, resetToken]);

  // Handle browser Back & Forward navigation buttons (fail-closed popstate synchronization)
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const v = params.get('view') || window.location.hash.replace('#', '') || 'login';
        if (v === 'dashboard') {
          if (hasValidSessionStorage()) {
            setAuthView('dashboard');
          } else {
            setAuthStatusVerified(false);
            setSessionNotice('Akses dasbor ditolak: sesi verifikator belum terautentikasi.');
            setAuthView('login');
            return;
          }
        } else if (v === 'reset_password') {
          setResetToken(params.get('token') || '');
          setAuthView('reset_password');
        } else if (v === 'logout') {
          setAuthView('logout');
        } else {
          setAuthView('login');
        }
        const rawTab = params.get('tab');
        if (rawTab && LEGACY_TAB_MAP[rawTab]) {
          setDashboardTab(rawTab, params.get('sub') || undefined);
        }
        const m = params.get('mode');
        if (m && ['dashboard', 'split', 'mobile'].includes(m)) {
          setViewMode(m);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Ref container scroll utama workspace dashboard
  const mainContentRef = useRef(null);

  // Auto-scroll ke paling atas setiap membuka tab, page, atau tampilan baru
  useEffect(() => {
    const scrollToTop = () => {
      // 1. Reset scroll container utama workspace
      if (mainContentRef.current) {
        mainContentRef.current.scrollTop = 0;
        mainContentRef.current.scrollLeft = 0;
      }
      // 2. Reset scroll window browser & document root (untuk landing, login, modal)
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
      }
    };

    scrollToTop();
    const rafId = requestAnimationFrame(scrollToTop);
    const timeoutId = setTimeout(scrollToTop, 60);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, [dashboardTab, authView, selectedCase, viewMode]);

  // Live Sidebar Badges synchronized with Claim Queue & Operations Store
  const badgesUrl = `${API_BASE_URL}/api/v1/system/sidebar-badges`;
  const [sidebarBadges, setSidebarBadges] = useState(() => (
    getCachedJsonSync(badgesUrl) || {
      queue_count: null,
      pending_cases: null,
      flagged_count: null,
      audit_chain_length: null,
    }
  ));

  useEffect(() => {
    if (authView !== 'dashboard' || !authStatusVerified) return;
    let active = true;
    const refreshBadges = async () => {
      try {
        const data = await cachedAuthGetJson(badgesUrl);
        if (data && active) {
          setSidebarBadges(data);
        }
      } catch {
        // Keep previous badge counts if temporarily offline
      }
    };
    refreshBadges();
    prefetchDashboardHotEndpoints();
    const handleOpsUpdated = () => refreshBadges();
    window.addEventListener('claimtrace:operations-updated', handleOpsUpdated);
    return () => {
      active = false;
      window.removeEventListener('claimtrace:operations-updated', handleOpsUpdated);
    };
  }, [authView, authStatusVerified, badgesUrl]);

  // Navigasi Sidebar Verifikator Terfokus (10 Hub Kerja dalam 3 Kelompok)
  const sidebarNavGroups = [
    {
      group: 'Alur Verifikasi Pra-Bayar',
      items: [
        {
          id: 'queue',
          label: 'Antrean & Berkas Klaim',
          keywords: 'antrean daftar sep prioritas top-k triase cepat manajemen berkas ditandai flagged sla 10 hari',
          icon: ListFilter,
          badge: (sidebarBadges.total_claims ?? sidebarBadges.pending_cases) != null ? String(sidebarBadges.total_claims ?? sidebarBadges.pending_cases) : undefined,
          badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
        },
        { id: 'investigation', label: 'Telaah & Dokumen Medis', keywords: 'telaah kasus investigasi 4 lapis upcoding 7 dokumen icd-10 mb1 frista mobile jkn', icon: FileText },
        { id: 'decision', label: 'Konsol Putusan & BAKB', keywords: 'putusan bakb bahv sanggahan fhir claim submit tkmkb', icon: ShieldAlert },
      ],
    },
    {
      group: 'Pengawasan Faskes & Forensik',
      items: [
        { id: 'faskes', label: 'Faskes & DPJP', keywords: 'fri profil rs ranking sindikat dpjp sip geovelocity retensi kepatuhan surveilans', icon: Building2 },
        { id: 'empirical', label: 'Forensik & Gudang Data', keywords: 'benford lorenz gini phantom repeat billing sql tren privasi analitik', icon: Zap },
        { id: 'mobile_bridge', label: 'Klarifikasi & Mobile JKN', keywords: 'mobile jkn lapis 3 jadwal klarifikasi peserta dialog intervensi s06', icon: Smartphone },
        { id: 'official_reports', label: 'Laporan & Jejak Audit', keywords: 'cetak pdf sp-1 bahv ba pending berita acara vedika audit sha-256 ledger', icon: Printer },
      ],
    },
    {
      group: 'Ringkasan & Bantuan',
      items: [
        { id: 'executive', label: 'Dashboard Ringkasan', keywords: 'ringkasan eksekutif home beranda kpi', icon: LayoutDashboard },
        { id: 'health_ai_chat', label: 'Asisten Klinis JKN', keywords: 'asisten chat tanya regulasi jkn permenkes kopilot ai', icon: Sparkles },
        { id: 'settings', label: 'Pengaturan & Akun', keywords: 'setting tema kebijakan ambang profil sandi sesi perangkat', icon: Settings },
      ],
    },
  ];

  const commandPaletteSubItems = [
    { id: 'quick_triage', label: 'Triase Cepat', keywords: 'triase cepat jalur merah kuning', icon: ClipboardList },
    { id: 'cases_mgmt', label: 'Manajemen Berkas', keywords: 'manajemen kasus berkas', icon: Briefcase },
    { id: 'flagged_sessions', label: 'Berkas Ditandai', keywords: 'flagged ditandai anomali', icon: Flag },
    { id: 'document_checker', label: 'Cek 7 Dokumen RS', keywords: '7 dokumen rm sep icd-10 kemenkes pnpk', icon: FileCheck2 },
    { id: 'fraud_ranking', label: 'Peringkat Risiko Faskes', keywords: 'ranking faskes kohort sindikat', icon: Building2 },
    { id: 'dpjp', label: 'Intelijen DPJP & SIP', keywords: 'dpjp dokter sip geovelocity impossible travel', icon: Stethoscope },
    { id: 'retention', label: 'Kepatuhan & Retensi RS', keywords: 'retensi kepatuhan faskes', icon: Users },
    { id: 'insights', label: 'Analitik Tren Klaim', keywords: 'insights tren statistik privasi', icon: Sparkles },
    { id: 'database_viewer', label: 'Gudang Data & SQL', keywords: 'sql query tabel analitik gudang', icon: Database },
    { id: 'appointments', label: 'Jadwal Klarifikasi RS', keywords: 'jadwal panggilan klarifikasi faskes', icon: Calendar },
    { id: 'conversations', label: 'Konfirmasi Peserta', keywords: 'percakapan respon peserta', icon: MessageSquare },
    { id: 'interventions', label: 'Intervensi & Tindak Lanjut', keywords: 'intervensi s06 hold pembayaran', icon: ShieldCheck },
    { id: 'audit', label: 'Jejak Audit Sistem', keywords: 'audit sha-256 ledger log forensik', icon: Key },
    { id: 'profile', label: 'Profil & Keamanan Sesi', keywords: 'profil sandi sesi perangkat dipercaya', icon: User },
  ];

  const sidebarNavItems = sidebarNavGroups.flatMap((g) => g.items);
  const commandPaletteGroups = [
    ...sidebarNavGroups,
    { group: 'Akses Cepat Sub-Tampilan', items: commandPaletteSubItems },
  ];
  const allSearchableItems = [...sidebarNavItems, ...commandPaletteSubItems];
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandPaletteQuery, setCommandPaletteQuery] = useState('');

  useEffect(() => {
    if (authView !== 'dashboard' || !authStatusVerified) return;
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      } else if (e.key === 'Escape' && isMobileViewport && !sidebarCollapsed) {
        setSidebarCollapsed(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authView, authStatusVerified, commandPaletteOpen]);

  const activeNavGroup = sidebarNavGroups.find((g) => g.items.some((i) => i.id === dashboardTab)) || sidebarNavGroups[0];
  const activeNavItem = sidebarNavItems.find((i) => i.id === dashboardTab) || { id: dashboardTab, label: 'Portal Verifikator' };

  // User Profile & Roles (Standar Kepegawaian BPJS Kesehatan)
  const sanitizeOfficialField = (val, fallback) =>
    String(val || fallback)
      .replace(/\s*\((Akun Fiktif|Fiktif|Sintetis|Data Sintetis|Simulasi)\)/gi, '')
      .replace('.demo@', '@')
      .replace('verifikator.simulasi@', 'siti.rahma@')
      .trim();

  const getInitialUser = () => {
    if (typeof window !== 'undefined' && hasValidSessionStorage()) {
      try {
        const stored = localStorage.getItem('claimtrace_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          const nipVal = parsed?.nip || parsed?.sub;
          if (parsed && parsed.isMfaVerified === true && (parsed.name || nipVal)) {
            return {
              name: sanitizeOfficialField(parsed.name, ''),
              email: sanitizeOfficialField(parsed.email, ''),
              nip: sanitizeOfficialField(nipVal, ''),
              role: sanitizeOfficialField(parsed.role || parsed.roleTitle, 'Verifikator Medis'),
              roleTitle: sanitizeOfficialField(parsed.roleTitle || parsed.role, 'Verifikator Medis'),
              unit: parsed.unit || 'Kedeputian Bidang Pengawasan dan Pemeriksaan',
              avatar: parsed.avatar || (parsed.name ? parsed.name.slice(0, 2).toUpperCase() : 'VR'),
              isMfaVerified: true,
              idleTimeoutMinutes: parsed.idleTimeoutMinutes || 15,
              sessionDurationMinutes: parsed.sessionDurationMinutes || 480,
              allowedRoles: parsed.allowedRoles || ['VERIFICATOR_MEDIS'],
            };
          }
        }
      } catch {}
    }
    return null;
  };

  const [currentUser, setCurrentUser] = useState(getInitialUser);
  const [lastLoggedOutUser, setLastLoggedOutUser] = useState(null);
  const lastServerTouchRef = useRef(0);
  const lastUiResetRef = useRef(Date.now());
  const idleLimitSecRef = useRef(900);
  const prevMobileRef = useRef(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
  const headerPopoversRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && currentUser?.isMfaVerified) {
      try {
        localStorage.setItem('claimtrace_user', JSON.stringify(currentUser));
      } catch {}
    }
  }, [currentUser]);

  const handleLogout = async (revokeAll = false, customReason = '') => {
    const token = getStoredAuthToken();
    const userSnapshot = currentUser ? { ...currentUser } : null;
    try {
      if (token) {
        await fetch(
          `${API_BASE_URL}/api/v1/auth/logout${revokeAll ? '?revoke_all=true' : ''}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'X-BPJS-Token': token,
              'X-Device-Fingerprint': getDeviceFingerprint(),
            },
          }
        );
      }
    } catch {
      // Tetap cabut sesi lokal meskipun koneksi backend terputus (fail-closed)
    }
    clearSessionStorage({ broadcast: true });
    setLastLoggedOutUser(userSnapshot);
    setCurrentUser(null);
    setAuthStatusVerified(false);
    setSessionIdleSeconds(null);
    setProfileMenuOpen(false);
    setAlertsMenuOpen(false);
    setLogoutReason(
      customReason ||
        (revokeAll
          ? 'Seluruh sesi perangkat aktif Anda telah dicabut dari server.'
          : 'Sesi verifikator telah ditutup dan token akses berhasil dicabut.')
    );
    setAuthView('logout');
  };

  // Fail-closed strict backend session check on load, focus, and 30s interval
  const verifySessionWithServer = React.useCallback(async (touch = false) => {
    const token = getStoredAuthToken();
    if (!token) {
      setAuthStatusVerified(false);
      setCurrentUser(null);
      setSessionIdleSeconds(null);
      setAuthView((prev) => {
        if (prev === 'dashboard') {
          setSessionNotice('Sesi belum terautentikasi. Silakan masuk melalui gerbang verifikator.');
          return 'login';
        }
        return prev;
      });
      return false;
    }

    try {
      if (touch) lastServerTouchRef.current = Date.now();
      const res = await verifySessionRequest(token, touch);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.status !== 'valid' || !data?.user) {
        const errMsg =
          data?.detail ||
          data?.message ||
          'Sesi tidak valid, kedaluwarsa, atau tidak cocok perangkat. Silakan masuk kembali.';
        clearSessionStorage({ broadcast: true });
        setAuthStatusVerified(false);
        setCurrentUser(null);
        setSessionIdleSeconds(null);
        setSessionNotice(errMsg);
        setAuthView((prev) => (prev === 'logout' || prev === 'reset_password' ? prev : 'login'));
        return false;
      }

      const raw = data.user;
      const nipVal = raw.nip || raw.sub || '';
      const mfaDone = Boolean(raw.isMfaVerified ?? raw.mfa);
      if (!mfaDone || !nipVal) {
        clearSessionStorage({ broadcast: true });
        setAuthStatusVerified(false);
        setCurrentUser(null);
        setSessionNotice('Otorisasi MFA berlapis wajib diselesaikan sebelum masuk ke dasbor.');
        setAuthView((prev) => (prev === 'logout' || prev === 'reset_password' ? prev : 'login'));
        return false;
      }

      setCurrentUser((prev) => {
        const merged = {
          ...(prev || {}),
          ...raw,
          nip: nipVal,
          name: sanitizeOfficialField(raw.name || prev?.name, nipVal),
          email: sanitizeOfficialField(raw.email || prev?.email, ''),
          role: sanitizeOfficialField(raw.role || prev?.role, 'Verifikator Medis'),
          roleTitle: sanitizeOfficialField(prev?.roleTitle || raw.roleTitle || raw.role, 'Verifikator Medis'),
          unit: raw.unit || prev?.unit || 'Kedeputian Bidang Pengawasan dan Pemeriksaan',
          avatar: prev?.avatar || (raw.name ? raw.name.slice(0, 2).toUpperCase() : 'VR'),
          isMfaVerified: true,
          idleTimeoutMinutes: raw.idle_sec ? Math.round(raw.idle_sec / 60) : (prev?.idleTimeoutMinutes || 15),
          allowedRoles: raw.allowedRoles || prev?.allowedRoles || ['VERIFICATOR_MEDIS'],
        };
        saveAuthenticatedSession(token, merged);
        return merged;
      });

      const srvIdle = data.session_timings?.idle_remaining_seconds;
      if (typeof srvIdle === 'number') {
        idleLimitSecRef.current = raw.idle_sec ? Number(raw.idle_sec) : Math.max(idleLimitSecRef.current, srvIdle);
        setSessionIdleSeconds(srvIdle);
      }
      setAuthStatusVerified(true);
      setSessionNotice('');
      return true;
    } catch {
      setAuthStatusVerified(false);
      setSessionNotice('Gagal memverifikasi sesi keamanan dengan server ClaimTrace.');
      setAuthView((prev) => (prev === 'logout' || prev === 'reset_password' ? prev : 'login'));
      return false;
    }
  }, []);

  useEffect(() => {
    verifySessionWithServer(false);
    const onFocusOrVisible = () => {
      if (document.visibilityState === 'visible' && getStoredAuthToken()) {
        verifySessionWithServer(false);
      }
    };
    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);
    const intervalId = setInterval(() => {
      if (getStoredAuthToken()) {
        verifySessionWithServer(false);
      }
    }, 30000);
    return () => {
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
      clearInterval(intervalId);
    };
  }, [verifySessionWithServer]);

  // Client-side sliding idle countdown + automatic session lockout
  useEffect(() => {
    if (authView !== 'dashboard' || !authStatusVerified || !currentUser?.isMfaVerified) {
      return;
    }
    const onUserActivity = () => {
      const now = Date.now();
      if (now - lastUiResetRef.current > 5000) {
        lastUiResetRef.current = now;
        setSessionIdleSeconds(idleLimitSecRef.current);
      }
      if (now - lastServerTouchRef.current > 45000) {
        verifySessionWithServer(true);
      }
    };
    const events = ['mousemove', 'keydown', 'pointerdown', 'scroll'];
    events.forEach((evt) => window.addEventListener(evt, onUserActivity, { passive: true }));
    const tickId = setInterval(() => {
      setSessionIdleSeconds((prev) => (typeof prev === 'number' ? Math.max(0, prev - 1) : prev));
    }, 1000);
    return () => {
      events.forEach((evt) => window.removeEventListener(evt, onUserActivity));
      clearInterval(tickId);
    };
  }, [authView, authStatusVerified, currentUser?.isMfaVerified, verifySessionWithServer]);

  useEffect(() => {
    if (authView === 'dashboard' && authStatusVerified && sessionIdleSeconds === 0) {
      const token = getStoredAuthToken();
      if (token) {
        fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'X-BPJS-Token': token, 'X-Device-Fingerprint': getDeviceFingerprint() },
        }).catch(() => {});
      }
      clearSessionStorage({ broadcast: true });
      setAuthStatusVerified(false);
      setCurrentUser(null);
      setSessionIdleSeconds(null);
      setProfileMenuOpen(false);
      setSessionNotice('Sesi dikunci otomatis karena batas waktu tidak ada aktivitas (Idle Timeout).');
      setAuthView('login');
    }
  }, [authView, authStatusVerified, sessionIdleSeconds]);

  // Multi-tab logout / revocation synchronization
  useEffect(() => {
    const onStorageSync = (e) => {
      if (e.key === 'bpjs_auth_token' || e.key === 'claimtrace_session_revoked_at') {
        if (!getStoredAuthToken()) {
          setAuthStatusVerified(false);
          setCurrentUser(null);
          setSessionIdleSeconds(null);
          setProfileMenuOpen(false);
          setSessionNotice('Sesi autentikasi telah ditutup atau dicabut dari tab lain.');
          setAuthView((prev) => (prev === 'logout' || prev === 'reset_password' ? prev : 'login'));
        }
      }
    };
    window.addEventListener('storage', onStorageSync);
    return () => window.removeEventListener('storage', onStorageSync);
  }, []);

  // Header Popover States (Alerts Bell & Admin Profile Dropdown
  const [profileMenuOpen, setProfileMenuOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('menu') === 'profile';
    }
    return false;
  });
  const [alertsMenuOpen, setAlertsMenuOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('menu') === 'alerts';
    }
    return false;
  });
  const [headerSearch, setHeaderSearch] = useState('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [headerAlerts, setHeaderAlerts] = useState([
    {
      id: 'ALT-01',
      severity: 'critical',
      type: 'ANOMALI JALUR MERAH',
      title: 'Berkas Prioritas Tinggi (CLM-2026-8801)',
      message: 'Memerlukan telaah 4-Lapis pra-bayar & konfirmasi SDMK/Mobile JKN.',
      time: 'Live',
      is_seen: false,
      targetTab: 'investigation'
    },
    {
      id: 'ALT-02',
      severity: 'high',
      type: 'PERINGATAN SLA 10 HK',
      title: 'Kepatuhan Batas Waktu Verifikasi Klaim',
      message: 'Pantau antrean klaim Jalur Kuning/Merah sebelum batas Perpres 82/2018.',
      time: 'Aktif',
      is_seen: false,
      targetTab: 'decision'
    },
  ]);

  useEffect(() => {
    if (authView !== 'dashboard' || !authStatusVerified) return;
    let active = true;
    cachedAuthGetJson(`${API_BASE_URL}/api/v1/claims`).then((rawList) => {
      if (!active || !Array.isArray(rawList) || rawList.length === 0) return;
      const priorityItems = rawList
        .filter((r) => r?.triage?.triage_lane === 'MERAH' || r?.triage?.triage_lane === 'KUNING')
        .slice(0, 4)
        .map((entry, idx) => {
          const { claim, triage } = entry;
          const mappedCase = {
            id: claim.claim_id,
            sep: claim.fkl02_id_kunjungan || claim.claim_id,
            hospital: claim.nama_faskes,
            date: claim.tanggal_layanan,
            code: claim.ina_cbg_code,
            description: claim.deskripsi_cbg,
            dpjp: claim.dpjp_meta?.nama_dpjp_alias || '-',
            tariff: `Rp ${Number(claim.nilai_klaim_rp || 0).toLocaleString('id-ID')}`,
            claimCount: claim.episode_meta?.jumlah_klaim_klaster || 1,
            s1: Math.round(claim.s1_score ?? triage?.score_breakdown?.s1_value ?? 0),
            s2: Math.round(claim.s2_score ?? triage?.score_breakdown?.s2_value ?? 0),
            s3: Math.round(claim.s3_score ?? triage?.score_breakdown?.s3_value ?? 0),
            totalScore: Number(triage?.final_priority_score ?? 0),
            lane: triage?.triage_lane === 'MERAH' ? 'red' : triage?.triage_lane === 'KUNING' ? 'yellow' : 'green',
            rawClaim: claim,
            rawTriage: triage,
          };
          return {
            id: `ALT-${claim.claim_id}`,
            severity: triage?.triage_lane === 'MERAH' ? 'critical' : 'high',
            type: triage?.ai_anomaly_prediction?.primary_anomaly_category || 'PRIORITAS TELAAH',
            title: `${claim.nama_faskes} (${claim.claim_id})`,
            message: `Skor ${Number(triage?.final_priority_score || 0).toFixed(1)} · SLA ${triage?.sla_deadline_days ?? 3} HK · ${triage?.ringkasan_bukti_audit?.slice(0, 80) || 'Siap diperiksa.'}`,
            time: idx === 0 ? 'Prioritas #1' : `Prioritas #${idx + 1}`,
            is_seen: false,
            targetTab: 'investigation',
            claimData: mappedCase,
          };
        });
      if (priorityItems.length > 0) {
        setHeaderAlerts(priorityItems);
      }
    }).catch(() => {});
    return () => { active = false; };
  }, [authView, authStatusVerified]);

  // Layar aktif di Mobile JKN Simulator
  const [currentScreen, setCurrentScreen] = useState('home');
  const [activeTab, setActiveTab] = useState('home');
  const [bannerIdx, setBannerIdx] = useState(0);

  // Status Verifikasi Presensi Lapis 3 Mobile JKN
  const [notificationToast, setNotificationToast] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [patientResponse, setPatientResponse] = useState(null); // null | 'confirmed' | 'denied'
  const [toastMessage, setToastMessage] = useState('');

  // Auto-dismiss Toast Notifikasi setelah 3.2 detik
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage('');
    }, 3200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Tutup popover header otomatis saat navigasi, Escape, atau klik di luar menu
  useEffect(() => {
    setAlertsMenuOpen(false);
    setProfileMenuOpen(false);
  }, [dashboardTab, viewMode, commandPaletteOpen]);

  useEffect(() => {
    if (!alertsMenuOpen && !profileMenuOpen) return;
    const handleOutside = (e) => {
      if (headerPopoversRef.current && !headerPopoversRef.current.contains(e.target)) {
        setAlertsMenuOpen(false);
        setProfileMenuOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setAlertsMenuOpen(false);
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [alertsMenuOpen, profileMenuOpen]);

  // Handle HTTP 401 Unauthorized Session Expiration Interceptor (Fail-Closed)
  useEffect(() => {
    const handleSessionExpired = () => {
      const msg = 'Sesi verifikator telah kedaluwarsa, tidak cocok perangkat, atau dicabut server. Silakan masuk kembali.';
      clearSessionStorage({ broadcast: true });
      setAuthStatusVerified(false);
      setCurrentUser(null);
      setSessionIdleSeconds(null);
      setProfileMenuOpen(false);
      setAlertsMenuOpen(false);
      setSessionNotice(msg);
      setToastMessage(msg);
      setAuthView('login');
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('claimtrace:session-expired', handleSessionExpired);
      return () => window.removeEventListener('claimtrace:session-expired', handleSessionExpired);
    }
  }, []);

  // Auto-dismiss Push Notifikasi Mobile JKN setelah 4.5 detik jika tidak diinteraksi
  useEffect(() => {
    if (!notificationToast) return;
    const timer = setTimeout(() => {
      setNotificationToast(false);
    }, 4500);
    return () => clearTimeout(timer);
  }, [notificationToast]);
  
  // Skor Dinamis Fusi Matematis Lapis 1, 2, 3
  const [lapis3Score, setLapis3Score] = useState(80);
  const [verificatorAction, setVerificatorAction] = useState(null);

  // Jam Resmi Server BPJS Kesehatan (Tersinkronisasi dengan Server Waktu Indonesia Barat - WIB)
  const serverOffsetRef = useRef(0);
  const [currentServerTime, setCurrentServerTime] = useState(() => {
    return new Date().toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).replace(/\./g, ':') + ' WIB';
  });

  useEffect(() => {
    fetch(`${API_BASE_URL}/health`, { cache: 'no-store' })
      .then((res) => {
        const serverDateHeader = res.headers.get('date');
        if (serverDateHeader) {
          const serverEpoch = new Date(serverDateHeader).getTime();
          if (!isNaN(serverEpoch)) {
            serverOffsetRef.current = serverEpoch - Date.now();
          }
        }
      })
      .catch(() => {});
  }, []);

  // Mode Tema Dasbor (light / dark / system) - Default: Light (Clinical White)
  const [theme, setTheme] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const urlTheme = params.get('theme');
        if (urlTheme === 'light' || urlTheme === 'dark' || urlTheme === 'system') {
          return urlTheme;
        }
        return localStorage.getItem('claimtrace_theme') || 'light';
      }
    } catch {
      return 'light';
    }
    return 'light';
  });

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

  const isAuthThemeLocked = authView === 'login' || authView === 'reset_password';
  const effectiveTheme = theme === 'system' ? (systemPrefersLight ? 'light' : 'dark') : theme;
  const isLight = isAuthThemeLocked ? true : effectiveTheme === 'light';

  useEffect(() => {
    try {
      localStorage.setItem('claimtrace_theme', theme);
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const scheme = isLight ? 'light' : 'dark';
      const meta = document.querySelector('meta[name="color-scheme"]');
      if (meta) {
        meta.content = scheme;
      }
      document.documentElement.style.colorScheme = scheme;
      if (isLight) {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      }
    }
  }, [isLight]);

  useEffect(() => {
    const timer = setInterval(() => {
      const syncedNow = new Date(Date.now() + (serverOffsetRef.current || 0));
      setCurrentServerTime(
        syncedNow.toLocaleTimeString('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }).replace(/\./g, ':') + ' WIB'
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Rotasi banner otomatis di home Mobile JKN
  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIdx((prev) => (prev === 0 ? 1 : 0));
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Update skor fusi matematis (Formula Tri-Layer)
  const s1 = 85; // Lapis 1: Lonjakan frekuensi klaim / unbundling
  const s2 = 95; // Lapis 2: Masa berlaku SIP DPJP & Geovelocity
  const s3 = lapis3Score; // Lapis 3: Respons faktual peserta
  const totalScore = Math.round((0.5 * s1 + 0.3 * s2 + 0.2 * s3) * 10) / 10;

  // Navigasi internal di smartphone
  const navigateTo = (screenName) => {
    setCurrentScreen(screenName);
    if (['home', 'berita', 'kartu', 'faq', 'profil'].includes(screenName)) {
      setActiveTab(screenName);
    }
  };

  // Sinkronisasi pengiriman notifikasi verifikator ke kanal Mobile JKN
  const triggerSimulation = () => {
    setNotificationToast(true);
    setToastMessage('Sinyal Lapis 3 terkirim: Permintaan konfirmasi presensi diteruskan ke aplikasi peserta.');
    if (viewMode === 'dashboard') {
      setViewMode('split');
    }
  };

  // Toggle / sembunyikan simulator dan batalkan popup presensi
  const toggleSimulation = () => {
    if (viewMode === 'split' || viewMode === 'mobile') {
      setViewMode('dashboard');
      setNotificationToast(false);
      setShowModal(false);
      setToastMessage('Layar Mobile JKN ditutup. Tampilan dikembalikan ke Cockpit Layar Penuh.');
    } else {
      setNotificationToast(true);
      setToastMessage('Sinyal Lapis 3 terkirim: Permintaan konfirmasi presensi diteruskan ke aplikasi peserta.');
      setViewMode('split');
    }
  };

  const closeSimulator = () => {
    setViewMode('dashboard');
    setNotificationToast(false);
    setShowModal(false);
    setToastMessage('Layar Mobile JKN ditutup. Mode Cockpit Penuh aktif.');
  };

  // Tangani respons peserta (Sinkronisasi status Lapis 3 ke backend dan UI)
  const handlePatientAnswer = (answer) => {
    setPatientResponse(answer);
    setShowModal(false);
    setNotificationToast(false);
    
    const attended = answer === 'confirmed';
    const targetClaimId = selectedCase?.id || 'CLM-2026-0001';

    // Kirim mutasi resmi ke backend via authFetch (dengan hak ADJUDICATE verifikator)
    authFetch(`${API_BASE_URL}/api/v1/claims/${targetClaimId}/mobile-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attended }),
    }).catch((err) => {
      console.warn('[Mobile JKN Sync Warning]:', err?.message || err);
    });

    if (answer === 'denied') {
      setLapis3Score(92);
      setToastMessage('[Simulasi Sandbox Mobile JKN] Peserta menyangkal kehadiran. Skor anomali Lapis 3 naik ke 92 (Indikasi Phantom Billing).');
    } else {
      setLapis3Score(30);
      setToastMessage('[Simulasi Sandbox Mobile JKN] Peserta mengonfirmasi kehadiran sah. Sinyal Lapis 3 tervalidasi.');
    }
  };

  const resetPresensiSession = () => {
    setPatientResponse(null);
    setLapis3Score(80);
    setVerificatorAction(null);
    setNotificationToast(true);
    setShowModal(false);
    setToastMessage('');
    navigateTo('home');
  };

  // Helper untuk inisial nama dokter & pejabat (menghindari gelar seperti dr. menjadi 'dS')
  const getInitials = (name) => {
    if (!name) return 'AD';
    const clean = name.replace(/^(?:dr\.|drg\.|prof\.|apt\.|ns\.|ir\.)\s+/i, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  // -------------------------------------------------------------
  // RENDER APP WITH MOTION ANIMATED PRESENCE
  // -------------------------------------------------------------
  return (
    <StatsigProvider client={client} loadingComponent={<div>Loading...</div>}>
      <GrowthBookProvider growthbook={growthbook}>
        <>
          <AnimatePresence mode="wait">
      {(authView === 'login' || authView === 'reset_password') && (
        <motion.div 
          key="login"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="bg-[#F7F8FA] text-[#061B31] fixed inset-0 h-dvh max-h-dvh flex flex-col font-sans overflow-y-auto z-40"
        >
          <SignInPage
            sessionNotice={sessionNotice}
            initialMode={authView === 'reset_password' ? 'reset' : 'login'}
            resetToken={resetToken}
            onExitReset={() => {
              setResetToken('');
              setAuthView('login');
            }}
            onLoginSuccess={(verifiedUser, meta) => {
              if (!verifiedUser || !verifiedUser.isMfaVerified) return;
              if (meta?.idleTimeoutSeconds) {
                idleLimitSecRef.current = Number(meta.idleTimeoutSeconds);
                setSessionIdleSeconds(Number(meta.idleTimeoutSeconds));
              } else {
                idleLimitSecRef.current = (verifiedUser.idleTimeoutMinutes || 15) * 60;
                setSessionIdleSeconds(idleLimitSecRef.current);
              }
              lastUiResetRef.current = Date.now();
              lastServerTouchRef.current = Date.now();
              setCurrentUser(verifiedUser);
              setAuthStatusVerified(true);
              setSessionNotice('');
              setAuthView('dashboard');
            }}
          />

          <footer className="shrink-0 bg-slate-100 border-slate-200 text-slate-600 border-t py-2.5 px-4 sm:px-8 text-xs z-20">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="font-medium text-slate-700">
                © 2026 BPJS Kesehatan · ClaimTrace
              </span>
              <span className="text-[10.5px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Seluruh Data Adalah Data Sintetis Fiktif · UU PDP No. 27/2022
              </span>
            </div>
          </footer>
        </motion.div>
      )}

      {authView === 'logout' && (
        <motion.div 
          key="logout"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-slate-500">Menutup sesi verifikator...</div>}>
            <SignOutPage 
              onLoginAgain={() => {
                setSessionNotice('');
                setAuthView('login');
              }}
              onGoToLogin={() => {
                setSessionNotice('');
                setAuthView('login');
              }}
              user={lastLoggedOutUser || currentUser}
              reason={logoutReason}
              isLight={isLight}
            />
          </Suspense>
        </motion.div>
      )}

      {authView === 'dashboard' && authStatusVerified && currentUser?.isMfaVerified ? (
        <motion.div 
          key="dashboard"
          id="cockpit-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`h-dvh max-h-dvh flex flex-col font-sans antialiased overflow-hidden selection:bg-emerald-500 selection:text-white transition-colors duration-300 relative ${
            isLight
              ? 'bg-[#F8FAFC] text-slate-900 theme-light'
              : 'dark bg-[#0A0E17] text-[#F3F5F8] theme-dark'
          }`}
        >
          {/* Ambient Lighting Spheres for Frosted Glass Refraction */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
            <div className={`absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-3xl opacity-40 transition-colors duration-500 ${
              isLight ? 'bg-gradient-to-br from-emerald-300/30 via-teal-200/20 to-transparent' : 'bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent'
            }`} />
            <div className={`absolute top-1/4 -right-32 w-[550px] h-[550px] rounded-full blur-3xl opacity-35 transition-colors duration-500 ${
              isLight ? 'bg-gradient-to-bl from-blue-300/25 via-sky-200/20 to-transparent' : 'bg-gradient-to-bl from-blue-600/15 via-sky-500/10 to-transparent'
            }`} />
            <div className={`absolute -bottom-32 left-1/3 w-[650px] h-[500px] rounded-full blur-3xl opacity-30 transition-colors duration-500 ${
              isLight ? 'bg-gradient-to-tr from-indigo-200/25 via-emerald-100/15 to-transparent' : 'bg-gradient-to-tr from-indigo-600/10 via-emerald-500/10 to-transparent'
            }`} />
          </div>

          {/* ======================================================== */}
          {/* UNIFIED HEADER (POLICYPILOT-INSPIRED CLEAN PRECISION)    */}
          {/* ======================================================== */}
          <header className={`glass-panel border-b px-4 py-2.5 shrink-0 z-40 relative transition-colors duration-300 ${
            isLight
              ? 'border-slate-200/80 text-slate-900 shadow-sm'
              : 'border-white/[0.08] text-[#F3F5F8]'
          }`}>
            <div className="w-full flex items-center justify-between gap-3">
              
              {/* Left: Sidebar Toggle, Brand Logo & Quick Search */}
              <div className="flex items-center space-x-3 shrink-0">
                <button 
                  type="button"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  aria-label={sidebarCollapsed ? "Buka Menu Modul" : "Ciutkan Menu Modul"}
                  aria-expanded={!sidebarCollapsed}
                  className={`p-2 rounded-xl transition cursor-pointer border flex items-center justify-center ${
                    isLight ? 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200' : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                  }`}
                  title={sidebarCollapsed ? "Buka Menu Modul" : "Ciutkan Menu Modul"}
                >
                  {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                </button>

                <div 
                  onClick={() => setDashboardTab('executive')}
                  className="flex items-center space-x-2.5 cursor-pointer group"
                  title="Dashboard Ringkasan Klaim JKN"
                >
                  <div className={`h-8 w-8 rounded-full p-1 flex items-center justify-center shrink-0 border shadow-sm backdrop-blur-md ${
                    isLight 
                      ? 'bg-emerald-50 border-emerald-400/50 shadow-emerald-500/10' 
                      : 'bg-white/10 border-emerald-400/40 shadow-emerald-500/20'
                  }`}>
                    <img 
                      alt="BPJS Kesehatan" 
                      className="h-full w-full object-contain" 
                      src="/assets/images/bpjs_icon.png"
                    />
                  </div>
                  <div className="hidden sm:block">
                    <div className="flex items-center space-x-1.5">
                      <span className={`font-display font-bold tracking-tight text-sm transition-colors ${
                        isLight ? 'text-slate-900 group-hover:text-emerald-700' : 'text-white group-hover:text-emerald-400'
                      }`}>ClaimTrace</span>
                      <span className={`text-[9.5px] font-mono font-semibold px-1.5 py-0.5 rounded-md border ${
                        isLight 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      }`}>
                        DSS JKN
                      </span>
                    </div>
                    <p className={`text-[10px] hidden 2xl:block whitespace-nowrap ${isLight ? 'text-slate-500' : 'text-white/55'}`}>
                      Pengawasan Pra-Pembayaran Klaim JKN
                    </p>
                  </div>
                </div>

                {/* Quick Search Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const q = headerSearch.trim();
                    if (!q) {
                      setCommandPaletteOpen(true);
                      return;
                    }
                    const ql = q.toLowerCase();
                    if (ql.includes('kebijakan') || ql.includes('setting') || ql.includes('rbac') || ql.includes('ambang')) {
                      setDashboardTab('settings');
                    } else if (ql.includes('sp-1') || ql.includes('sp1') || ql.includes('laporan') || ql.includes('berita acara')) {
                      setDashboardTab('official_reports');
                    } else if (ql.includes('bakb') || ql.includes('bahv') || ql.includes('putusan') || ql.includes('fhir')) {
                      setDashboardTab('decision');
                    } else if (ql.includes('audit') || ql.includes('sha')) {
                      setDashboardTab('audit');
                    } else if (ql.includes('dokumen') || ql.includes('icd') || ql.includes('kelengkapan')) {
                      setDashboardTab('document_checker');
                    } else if (ql.includes('benford') || ql.includes('lorenz') || ql.includes('gini') || ql.includes('empiris')) {
                      setDashboardTab('empirical');
                    } else if (ql.includes('sql') || ql.includes('gudang') || ql.includes('tabel') || ql.includes('analitik')) {
                      setDashboardTab('database_viewer');
                    } else if (ql.includes('faskes') || ql.includes('fri')) {
                      setDashboardTab('faskes');
                    } else if (ql.includes('dpjp') || ql.includes('sip') || ql.includes('geovelocity')) {
                      setDashboardTab('dpjp');
                    } else if (ql.includes('graf') || ql.includes('sindikat') || ql.includes('peringkat')) {
                      setDashboardTab('fraud_ranking');
                    } else if (ql.includes('kopilot') || ql.includes('copilot')) {
                      setDashboardTab('agent_copilot');
                    } else if (ql.includes('profil') || ql.includes('sesi') || ql.includes('perangkat')) {
                      setDashboardTab('profile');
                    } else {
                      setGlobalSearchQuery(q);
                      setDashboardTab('queue');
                    }
                  }}
                  className={`hidden xl:flex items-center border rounded-xl px-3 py-1.5 w-48 2xl:w-64 relative ml-2 transition-colors focus-within:ring-2 ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus-within:bg-white focus-within:border-emerald-500/60 focus-within:ring-emerald-500/20'
                      : 'bg-white/10 border-white/15 text-white focus-within:border-emerald-400/60 focus-within:ring-emerald-400/20'
                  }`}
                >
                  <Search className={`w-3.5 h-3.5 mr-2 shrink-0 ${isLight ? 'text-slate-500' : 'text-white/50'}`} />
                  <input
                    type="text"
                    aria-label="Cari modul, No. SEP, atau faskes"
                    placeholder="Cari SEP / Faskes..."
                    value={headerSearch}
                    onChange={(e) => setHeaderSearch(e.target.value)}
                    className={`bg-transparent border-none outline-none text-xs w-full pr-20 pl-0.5 focus:ring-0 ${
                      isLight ? 'text-slate-900 placeholder-slate-500' : 'text-white placeholder-white/50'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCommandPaletteQuery(headerSearch);
                      setCommandPaletteOpen(true);
                    }}
                    title="Buka Navigasi Cepat Portal (Ctrl+K)"
                    className={`absolute right-12 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-[10px] font-mono border transition cursor-pointer ${
                      isLight
                        ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        : 'bg-white/5 text-white/70 border-white/15 hover:bg-white/10'
                    }`}
                  >
                    Ctrl+K
                  </button>
                  <button
                    type="submit"
                    className={`absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md px-2 py-0.5 text-[11px] font-medium border transition-colors cursor-pointer ${
                      isLight 
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200/90' 
                        : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    Cari
                  </button>
                </form>
              </div>

              {/* Center/Right: Clean Navigation Actions */}
              <div ref={headerPopoversRef} className="flex items-center space-x-2 shrink-0">
                {/* Dual View Toggle (Mobile Simulation) */}
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'split' ? 'dashboard' : 'split')}
                  aria-label="Beralih ke tampilan Dual View"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                    viewMode === 'split'
                      ? (isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold')
                      : (isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70')
                  }`}
                  title="Buka panel Mobile JKN berdampingan"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Panel Mobile JKN</span>
                </button>

                {/* Quick Theme Toggle Button (Light / Dark) */}
                <button
                  type="button"
                  onClick={() => {
                    const nextTheme = effectiveTheme === 'light' ? 'dark' : 'light';
                    setTheme(nextTheme);
                    setToastMessage(nextTheme === 'light' ? 'Tema Terang Aktif' : 'Tema Gelap Aktif');
                  }}
                  className={`p-2 rounded-xl transition cursor-pointer flex items-center justify-center border ${
                    isLight 
                      ? 'border-slate-200 bg-slate-100 text-amber-600 hover:bg-slate-200' 
                      : 'border-white/10 bg-white/5 text-amber-400 hover:bg-white/10'
                  }`}
                  title={effectiveTheme === 'light' ? "Beralih ke Tema Gelap" : "Beralih ke Tema Terang"}
                  aria-label="Ganti Mode Tema Dasbor"
                >
                  {isLight ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
                </button>

                {/* 1. Notification Bell + Alerts Popover */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setAlertsMenuOpen(!alertsMenuOpen);
                      setProfileMenuOpen(false);
                    }}
                    className={`relative p-2 rounded-xl transition cursor-pointer flex items-center justify-center border ${
                      alertsMenuOpen 
                        ? (isLight ? 'border-slate-300 bg-slate-200 text-slate-900 shadow-2xs' : 'border-white/20 bg-white/15 text-white shadow-sm') 
                        : (isLight ? 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200' : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10')
                    }`}
                    aria-label="Notifikasi dan Peringatan Audit Klaim"
                  >
                    <Bell className={`w-4 h-4 ${isLight ? 'text-slate-700' : 'text-white/80'}`} />
                    {headerAlerts.filter((a) => !a.is_seen).length > 0 && (
                      <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center tabular-nums keep-white ${
                        isLight ? 'border-2 border-white shadow-xs' : 'border-2 border-[#000c24]'
                      }`}>
                        {headerAlerts.filter((a) => !a.is_seen).length}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {alertsMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 6 }}
                        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                        className={`absolute right-0 mt-2.5 w-84 sm:w-[410px] origin-top-right border rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl ${
                          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#00153A] border-white/10 text-white'
                        }`}
                      >
                        <div className={`px-4 py-3 border-b flex items-start justify-between gap-4 ${
                          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#001030] border-white/10'
                        }`}>
                          <div>
                            <p className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Peringatan Audit Klaim</p>
                            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                              {headerAlerts.filter((a) => !a.is_seen).length} belum dibaca
                            </p>
                          </div>
                          <div className={`flex items-center gap-2 text-[11px] font-medium ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span>Langsung</span>
                          </div>
                        </div>

                        <div className={`max-h-80 overflow-y-auto divide-y ${isLight ? 'divide-slate-200' : 'divide-white/10'}`}>
                          {headerAlerts.map((alert) => (
                            <button
                              key={alert.id}
                              type="button"
                              onClick={() => {
                                setHeaderAlerts((prev) =>
                                  prev.map((item) =>
                                    item.id === alert.id ? { ...item, is_seen: true } : item
                                  )
                                );
                                if (alert.claimData) {
                                  setSelectedCase(alert.claimData);
                                }
                                setDashboardTab(alert.targetTab || 'investigation');
                                setAlertsMenuOpen(false);
                              }}
                              className={`w-full text-left px-4 py-3 transition-colors cursor-pointer ${
                                alert.is_seen 
                                  ? (isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5') 
                                  : (isLight ? 'bg-emerald-50/70 hover:bg-emerald-100/70' : 'bg-emerald-500/10 hover:bg-emerald-500/20')
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <span
                                    className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                                      alert.severity === 'critical'
                                        ? 'bg-red-500 shadow-sm shadow-red-500/50'
                                        : alert.severity === 'high'
                                        ? 'bg-orange-500'
                                        : 'bg-sky-500'
                                    }`}
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                                      <span
                                        className={
                                          alert.severity === 'critical'
                                            ? 'text-red-600 font-bold'
                                            : alert.severity === 'high'
                                            ? 'text-orange-600 font-bold'
                                            : 'text-sky-600 font-bold'
                                        }
                                      >
                                        {alert.severity === 'critical' ? 'KRITIS' : alert.severity === 'high' ? 'TINGGI' : 'INFORMASI'}
                                      </span>
                                      <span className={isLight ? 'text-slate-300' : 'text-white/20'}>|</span>
                                      <span className={isLight ? 'text-slate-500' : 'text-white/50'}>{alert.type}</span>
                                    </div>
                                    <p className={`text-xs font-semibold mt-0.5 line-clamp-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                      {alert.title}
                                    </p>
                                    <p className={`text-[11px] mt-0.5 line-clamp-2 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                                      {alert.message}
                                    </p>
                                  </div>
                                </div>
                                <span className={`text-[10px] whitespace-nowrap ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                                  {alert.time}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>

                        <div className={`px-4 py-2.5 border-t flex items-center justify-between ${
                          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#001030] border-white/10'
                        }`}>
                          <button
                            type="button"
                            onClick={() =>
                              setHeaderAlerts((prev) =>
                                prev.map((a) => ({ ...a, is_seen: true }))
                              )
                            }
                            className={`text-xs transition-colors cursor-pointer ${
                              isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white'
                            }`}
                          >
                            Tandai semua dibaca
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDashboardTab('queue');
                              setAlertsMenuOpen(false);
                            }}
                            className={`text-xs font-bold transition-colors cursor-pointer ${
                              isLight ? 'text-emerald-700 hover:text-emerald-800' : 'text-emerald-400 hover:text-emerald-300'
                            }`}
                          >
                            Buka Antrean Klaim
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 2. User Avatar + Name + Dropdown Menu */}
                {typeof sessionIdleSeconds === 'number' && (
                  <button
                    type="button"
                    onClick={() => {
                      setDashboardTab('profile');
                      setAlertsMenuOpen(false);
                      setProfileMenuOpen(false);
                    }}
                    title="Buka Profil & Keamanan Sesi (Sisa waktu idle timeout)"
                    className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono font-semibold transition cursor-pointer ${
                      sessionIdleSeconds <= 120
                        ? (isLight ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-amber-500/15 border-amber-500/30 text-amber-300')
                        : (isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300')
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>
                      Sesi {String(Math.floor(sessionIdleSeconds / 60)).padStart(2, '0')}:
                      {String(sessionIdleSeconds % 60).padStart(2, '0')}
                    </span>
                  </button>
                )}

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(!profileMenuOpen);
                      setAlertsMenuOpen(false);
                    }}
                    className={`flex items-center p-1 pr-3 rounded-full border transition cursor-pointer ${
                      profileMenuOpen
                        ? (isLight ? 'border-slate-300 bg-slate-100 ring-2 ring-emerald-500/20' : 'border-white/20 bg-white/15 ring-2 ring-emerald-400/20')
                        : (isLight ? 'border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-slate-800 shadow-2xs' : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/90 shadow-sm')
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${
                      isLight ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300' : 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
                    }`}>
                      <span className="font-bold tracking-tight">
                        {currentUser?.avatar && currentUser.avatar !== 'dS' ? currentUser.avatar : getInitials(currentUser?.name || 'VR')}
                      </span>
                    </div>
                    <span className={`hidden md:inline-block ml-2 text-xs font-semibold max-w-[140px] 2xl:max-w-[200px] truncate ${isLight ? 'text-slate-900' : 'text-white/90'}`}>
                      {sanitizeOfficialField(currentUser?.name, 'Verifikator Terotentikasi')}
                    </span>
                    <ChevronDown
                      className={`hidden md:inline-block ml-1 transition-transform duration-150 w-3.5 h-3.5 ${
                        isLight ? 'text-slate-500' : 'text-white/50'
                      } ${profileMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {profileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 6 }}
                        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                        className={`absolute right-0 mt-2.5 w-68 origin-top-right border rounded-2xl shadow-2xl focus:outline-none py-1.5 z-50 backdrop-blur-xl ${
                          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0E1116] border-white/10 text-white'
                        }`}
                      >
                        <div className={`px-4 py-3 border-b ${isLight ? 'border-slate-200 bg-slate-50/70' : 'border-white/10 bg-[#141922]'}`}>
                          <p className={`text-sm font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {sanitizeOfficialField(currentUser?.name, 'Verifikator JKN')}
                          </p>
                          <p className={`text-xs truncate mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                            {sanitizeOfficialField(currentUser?.email, '-')}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                              isLight 
                                ? 'bg-slate-100 text-slate-700 border-slate-200' 
                                : 'bg-white/10 text-white/80 border-white/15'
                            }`}>
                              {sanitizeOfficialField(currentUser?.role, 'VERIFICATOR_MEDIS')}
                            </span>
                            <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                              NIP {sanitizeOfficialField(currentUser?.nip, '-')}
                            </span>
                          </div>
                          <div className={`mt-2 flex items-center gap-1.5 text-[10px] font-medium ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>MFA &amp; Binding Perangkat Terverifikasi</span>
                          </div>
                        </div>

                        <div className="p-1 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setDashboardTab('profile');
                              setProfileMenuOpen(false);
                            }}
                            className={`w-full text-left flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer group ${
                              isLight 
                                ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900' 
                                : 'text-white/80 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <User className={`mr-2.5 w-4 h-4 transition-colors ${
                              isLight ? 'text-slate-400 group-hover:text-slate-700' : 'text-white/40 group-hover:text-white'
                            }`} />
                            <span>Profil Verifikator</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setDashboardTab('settings');
                              setProfileMenuOpen(false);
                            }}
                            className={`w-full text-left flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer group ${
                              isLight 
                                ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900' 
                                : 'text-white/80 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <Settings className={`mr-2.5 w-4 h-4 transition-colors ${
                              isLight ? 'text-slate-400 group-hover:text-slate-700' : 'text-white/40 group-hover:text-white'
                            }`} />
                            <span>Pengaturan Sistem &amp; Sesi</span>
                          </button>

                          <div className={`my-1 border-t ${isLight ? 'border-slate-100' : 'border-white/10'}`} />

                          <button
                            type="button"
                            onClick={() => handleLogout(false)}
                            className={`w-full text-left flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer group ${
                              isLight 
                                ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700' 
                                : 'text-rose-400 hover:bg-rose-500/20 hover:text-rose-300'
                            }`}
                          >
                            <LogOut className={`mr-2.5 w-4 h-4 transition-colors ${
                              isLight ? 'text-rose-500 group-hover:text-rose-600' : 'text-rose-400 group-hover:text-rose-300'
                            }`} />
                            <span>Keluar Sesi</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleLogout(true)}
                            className={`w-full text-left flex items-center px-3 py-2 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer group ${
                              isLight 
                                ? 'text-amber-700 hover:bg-amber-50 hover:text-amber-800' 
                                : 'text-amber-300 hover:bg-amber-500/15 hover:text-amber-200'
                            }`}
                          >
                            <ShieldAlert className={`mr-2.5 w-3.5 h-3.5 transition-colors ${
                              isLight ? 'text-amber-600 group-hover:text-amber-700' : 'text-amber-400 group-hover:text-amber-300'
                            }`} />
                            <span>Cabut Semua Sesi Perangkat</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </header>

      {/* TOAST NOTIFIKASI FEEDBACK */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            key={toastMessage}
            initial={{ opacity: 0, y: -16, scale: 0.96, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: -12, scale: 0.96, x: "-50%" }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed top-20 left-1/2 z-50 text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 backdrop-blur-xl border overflow-hidden ${
              isLight 
                ? 'bg-white text-slate-900 border-emerald-500/40 shadow-slate-300/50' 
                : 'bg-[#00153A] text-white border-emerald-500/50 shadow-black/80'
            }`}
          >
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
            <button 
              type="button"
              onClick={() => setToastMessage('')} 
              aria-label="Tutup notifikasi"
              className={`ml-2 cursor-pointer p-1.5 min-w-[26px] min-h-[26px] flex items-center justify-center rounded transition ${isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
            {/* Animasi Garis Countdown Waktu Menghilang */}
            <motion.div
              key={`progress-${toastMessage}`}
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 3.2, ease: "linear" }}
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MAIN CONTAINER WITH SIDEBAR & WORKSPACE                  */}
      {/* ======================================================== */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">

        {/* Mobile Drawer Backdrop */}
        {isMobileViewport && !sidebarCollapsed && (
          <div
            onClick={() => setSidebarCollapsed(true)}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-30 lg:hidden"
            aria-hidden="true"
          />
        )}
        
        {/* COLLAPSIBLE SIDEBAR (ICON-VIEW & HOVER-MENU ARCHITECTURE) */}
        <motion.aside 
          animate={{ width: sidebarCollapsed ? (isMobileViewport ? 0 : 68) : 244 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className={`flex flex-col justify-between shrink-0 z-40 select-none transition-colors duration-200 ${
            isMobileViewport && !sidebarCollapsed ? 'fixed left-0 top-[54px] bottom-0 shadow-2xl border-r' : 'h-full'
          } ${
            sidebarCollapsed && isMobileViewport ? 'border-r-0 overflow-hidden pointer-events-none' : sidebarCollapsed ? 'border-r overflow-visible' : 'border-r overflow-hidden'
          } ${
            isLight
              ? 'bg-white border-slate-200/80 text-slate-900'
              : 'bg-[#0E131B] border-white/[0.08] text-[#F3F5F8]'
          }`}
        >
          {/* Navigation Links Grouped & Organized */}
          <div className={`p-2.5 overflow-y-auto flex-1 min-h-0 space-y-3.5 scrollbar-thin ${
            sidebarCollapsed ? 'overflow-visible' : ''
          } ${
            isLight ? 'scrollbar-thumb-slate-200' : 'scrollbar-thumb-slate-800'
          }`}>
            {sidebarNavGroups.map((group, gIdx) => (
              <div key={group.group} className="space-y-0.5">
                {!sidebarCollapsed ? (
                  <div className={`px-2.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between select-none ${
                    isLight ? 'text-slate-600' : 'text-slate-300'
                  }`}>
                    <span>{group.group}</span>
                    <span className={`text-[9px] font-mono font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{group.items.length}</span>
                  </div>
                ) : (
                  gIdx > 0 && <div className={`my-1.5 border-t ${isLight ? 'border-slate-200' : 'border-slate-800/80'}`} />
                )}

                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = dashboardTab === item.id;
                  return (
                    <div key={item.id} className="relative group">
                      <motion.button
                        type="button"
                        aria-label={item.label}
                        aria-current={isActive ? 'page' : undefined}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setDashboardTab(item.id);
                          if (isMobileViewport) {
                            setSidebarCollapsed(true);
                          }
                          if (mainContentRef.current) {
                            mainContentRef.current.scrollTop = 0;
                            mainContentRef.current.scrollLeft = 0;
                          }
                        }}
                        className={`relative w-full flex items-center ${
                          sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'justify-between px-3 py-2'
                        } rounded-xl text-xs transition-colors duration-150 cursor-pointer ${
                          isActive
                            ? (isLight
                                ? 'text-emerald-950 font-semibold bg-emerald-50/95 border border-emerald-200/90 shadow-xs'
                                : 'text-emerald-300 font-semibold bg-emerald-500/15 border border-emerald-500/35 shadow-xs')
                            : (isLight
                                ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 border border-transparent font-medium'
                                : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent font-medium')
                        }`}
                      >
                        {isActive && !sidebarCollapsed && (
                          <span className={`absolute left-1 top-2 bottom-2 w-1 rounded-full ${isLight ? 'bg-emerald-600' : 'bg-emerald-400'}`} />
                        )}
                        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2.5 min-w-0 pl-1'}`}>
                          <Icon className={`${sidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4'} shrink-0 ${
                            isActive 
                              ? (isLight ? 'text-emerald-700' : 'text-emerald-400') 
                              : (isLight ? 'text-slate-600 group-hover:text-slate-800' : 'text-slate-400 group-hover:text-slate-200')
                          }`} />
                          {!sidebarCollapsed && (
                            <span className="truncate text-left text-[12px] tracking-tight">{item.label}</span>
                          )}
                        </div>
                        {!sidebarCollapsed && item.badge && (
                          <span
                            className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded-md font-semibold shrink-0 ml-1.5 border leading-none ${
                              isActive
                                ? (isLight ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-emerald-500/30 text-emerald-200 border-emerald-400/50')
                                : (isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700')
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </motion.button>

                      {/* HOVER MENU FLYOUT (FOR ICON-VIEW / COLLAPSED SIDEBAR) */}
                      {sidebarCollapsed && (
                        <div className={`fixed left-[76px] -mt-9 px-3.5 py-2.5 rounded-xl shadow-2xl border pointer-events-none opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50 min-w-[210px] backdrop-blur-xl ${
                          isLight 
                            ? 'bg-white border-slate-200 text-slate-800 shadow-slate-300/60' 
                            : 'bg-[#222b38] border-[#2d3748] text-white shadow-black/80'
                        }`}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs">{item.label}</span>
                            {item.badge && (
                              <span className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded font-bold border ${item.badgeColor || 'bg-emerald-100 text-emerald-800'}`}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                            {group.group}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </motion.aside>

        {/* WORKSPACE AREA (COCKPIT LAYOUT) */}
        <main ref={mainContentRef} className={`flex-1 min-w-0 overflow-y-auto overflow-x-hidden px-3.5 sm:px-6 lg:px-7 py-3 lg:py-5 pb-28 min-h-0 transition-colors duration-300 relative z-10 ${
          isLight ? 'text-slate-900' : 'text-slate-100'
        }`}>
          <div className={`w-full max-w-[1700px] mx-auto ${
            viewMode === 'split' ? 'flex flex-col xl:flex-row gap-5 items-start' : 'space-y-4'
          }`}>

            {/* ======================================================== */}
            {/* SISI KIRI: MOBILE JKN REBUILT ENGINE (SPLIT MODE)        */}
            {/* ======================================================== */}
            {(viewMode === 'split' || viewMode === 'mobile') && (
              <div className={`flex flex-col items-center justify-start ${
                viewMode === 'split' ? 'w-full xl:w-[370px] shrink-0 sticky top-1 self-start' : 'max-w-md mx-auto w-full'
              }`}>
                {/* MOBILE JKN TOP ACTION BAR (CLOSE / DISMISS) */}
                <div className="w-full max-w-[365px] flex items-center justify-between gap-2 mb-2 px-1">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className={`text-[11px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                      isLight 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    }`}>
                      Aplikasi Mobile JKN
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={resetPresensiSession}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs transition-all cursor-pointer border whitespace-nowrap ${
                        isLight 
                          ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100' 
                          : 'border-white/15 bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                      }`}
                      title="Reset status konfirmasi presensi peserta"
                    >
                      <RotateCcw className={`w-3 h-3 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                      <span>Reset</span>
                    </button>

                    <button
                      type="button"
                      onClick={closeSimulator}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs transition-all cursor-pointer border whitespace-nowrap ${
                        isLight
                          ? 'text-rose-800 bg-rose-50 hover:bg-rose-100 border-rose-300'
                          : 'text-rose-200 bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/40'
                      }`}
                      title="Tutup layar Mobile JKN dan kembalikan ke Layar Penuh"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Tutup Layar</span>
                    </button>
                  </div>
                </div>

                {/* PHONE MOCKUP FRAME */}
                <div className="phone-mockup relative w-full max-w-[365px] h-[670px] xl:h-[700px] max-h-[calc(100vh-130px)] bg-slate-900 rounded-[44px] p-2.5 shadow-2xl border-4 border-slate-700/60 flex flex-col overflow-hidden">
                  
                  {/* Dynamic Island / Notch */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-950 rounded-full z-40 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-slate-800 rounded-full mr-2" />
                    <div className="w-1.5 h-1.5 bg-blue-900 rounded-full" />
                  </div>

                  {/* Mobile Screen Container */}
                  <div className="relative flex-1 bg-[#F5F7FA] rounded-[38px] overflow-hidden flex flex-col text-slate-800">
                    
                    {/* Status Bar */}
                    <div className="bg-gradient-to-r from-[#018849] via-[#0288D1] to-[#8E24AA] pt-2 px-6 pb-1 flex justify-between items-center text-white text-[11px] font-semibold select-none z-20">
                      <span>09:55</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px]">5G</span>
                        <div className="w-4 h-2 border border-white rounded-[2px] p-[1px] flex items-center">
                          <div className="h-full bg-white w-2/3 rounded-[1px]" />
                        </div>
                      </div>
                    </div>

                    {/* Top Bar Mobile JKN */}
                    {currentScreen === 'home' && (
                      <div className="bg-gradient-to-r from-[#018849] via-[#0288D1] to-[#8E24AA] px-4 py-2 flex items-center justify-between gap-2 shadow-sm z-20">
                        <img 
                          src="/assets/images/top_jkn_logo.png" 
                          alt="Mobile JKN" 
                          onClick={() => navigateTo('home')}
                          className="h-8 object-contain shrink-0 drop-shadow cursor-pointer"
                        />

                        {/* Search Bar */}
                        <div 
                          onClick={() => navigateTo('more_menu')}
                          className="flex-1 bg-white rounded-full px-3 py-1.5 flex items-center space-x-2 shadow-inner cursor-pointer"
                        >
                          <Search className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[11px] text-slate-400 truncate">
                            Info Peserta, Info Iuran...
                          </span>
                        </div>

                        {/* Notification Bell */}
                        <button
                          type="button"
                          aria-label="Buka pusat notifikasi Mobile JKN"
                          onClick={() => navigateTo('notifikasi')}
                          className="relative p-1.5 text-white/90 hover:text-white transition"
                        >
                          <Bell className="w-5 h-5 drop-shadow" />
                          {patientResponse === null && (
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
                          )}
                        </button>

                        {/* CS Avatar */}
                        <img 
                          src="/assets/images/cs_avatar.png" 
                          alt="Profil" 
                          onClick={() => navigateTo('profil')}
                          className="w-7 h-7 rounded-full object-cover border-2 border-white shadow cursor-pointer"
                        />
                      </div>
                    )}

                    {/* PUSH NOTIFIKASI SLIDE-DOWN (CLAIMTRACE LAPIS 3) */}
                    <AnimatePresence>
                      {notificationToast && currentScreen === 'home' && (
                        <motion.div 
                          initial={{ opacity: 0, y: -25, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -20, scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 350, damping: 25 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowModal(true)}
                          className="absolute top-16 left-3 right-3 bg-white rounded-2xl p-3 shadow-lg border-2 border-emerald-600 z-40 cursor-pointer"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="bg-emerald-600 p-2 rounded-xl text-white">
                              <Shield className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-emerald-800 tracking-wider">
                                  BPJS KESEHATAN · BARU SAJA
                                </span>
                                <div className="flex items-center space-x-1">
                                  <span className="text-[9px] text-slate-400">10:00</span>
                                  <button
                                    type="button"
                                    aria-label="Tutup notifikasi konfirmasi presensi"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setNotificationToast(false);
                                    }}
                                    className="p-0.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
                                    title="Tutup Notifikasi"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs font-bold text-slate-900 leading-snug mt-0.5">
                                Konfirmasi Kehadiran Pelayanan Medis
                              </p>
                              <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                                Mohon konfirmasi apakah Anda benar menerima layanan {selectedCase?.description || 'Rawat Jalan / Tindakan Medis'} di {selectedCase?.hospital || 'RS Khusus Mitra Husada'}.
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-emerald-700">
                            <span>Ketuk untuk verifikasi presensi (1-Klik)</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* ROUTING MULTI-LAYAR MOBILE JKN */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <Suspense fallback={<div className="p-6 text-center text-xs text-slate-500">Memuat layar Mobile JKN...</div>}>
                      {/* HOME */}
                      {currentScreen === 'home' && (
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5">
                          <div className="flex items-center justify-between pt-1">
                            <div>
                              <h2 className="text-base font-bold text-slate-900 leading-tight">
                                Hi, AHMAD SYAFIQ
                              </h2>
                              <p className="text-[11px] text-slate-500 font-medium">
                                Peserta JKN-KIS Aktif Terverifikasi · Kelas I
                              </p>
                            </div>
                            <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-md">
                              v4.18.0
                            </span>
                          </div>

                          {/* Antrean Online */}
                          <div 
                            onClick={() => navigateTo('antrean')}
                            className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200 flex items-center space-x-3 cursor-pointer hover:border-blue-400 transition"
                          >
                            <img 
                              src="/assets/images/antrean_illustration.png" 
                              alt="Antrean Online" 
                              className="w-20 h-20 object-contain shrink-0" 
                            />
                            <div className="flex-1">
                              <h3 className="text-xs font-bold text-[#0288D1]">Antrean Online</h3>
                              <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5">
                                Untuk kunjungan lebih efisien tanpa harus menunggu lama.
                              </p>
                              <button
                                type="button"
                                onClick={() => navigateTo('antrean')}
                                className="mt-2 bg-[#0288D1] hover:bg-[#0277bd] text-white text-[11px] font-bold px-4 py-1.5 rounded-full shadow-sm active:scale-95 transition"
                              >
                                Ambil Antrean
                              </button>
                            </div>
                          </div>

                          {/* 12 Grid Menus */}
                          <div className="grid grid-cols-4 gap-y-2.5 gap-x-1.5 bg-white rounded-2xl p-2.5 shadow-sm border border-slate-200">
                            <div onClick={() => navigateTo('more_menu')} className="flex flex-col items-center text-center group cursor-pointer min-w-0 px-0.5">
                              <img src="/assets/images/icon_program_jkn.png" alt="Info Program JKN" className="w-10 h-10 object-contain shrink-0" />
                              <span className="text-[9.5px] font-medium text-slate-700 leading-tight mt-1 break-words w-full line-clamp-2">Program JKN</span>
                            </div>
                            <div onClick={() => navigateTo('chat_dokter')} className="flex flex-col items-center text-center group cursor-pointer min-w-0 px-0.5">
                              <img src="/assets/images/icon_telehealth.png" alt="Telehealth" className="w-10 h-10 object-contain shrink-0" />
                              <span className="text-[9.5px] font-medium text-slate-700 leading-tight mt-1 break-words w-full line-clamp-2">TELEHEALTH</span>
                            </div>
                            <div onClick={() => navigateTo('riwayat')} className="flex flex-col items-center text-center group cursor-pointer min-w-0 px-0.5">
                              <img src="/assets/images/icon_icare.png" alt="Info Riwayat" className="w-10 h-10 object-contain shrink-0" />
                              <span className="text-[9.5px] font-medium text-slate-700 leading-tight mt-1 break-words w-full line-clamp-2">Riwayat</span>
                            </div>
                            <div onClick={() => navigateTo('bugar')} className="flex flex-col items-center text-center group cursor-pointer min-w-0 px-0.5">
                              <img src="/assets/images/icon_bugar.png" alt="Bugar" className="w-10 h-10 object-contain shrink-0" />
                              <span className="text-[9.5px] font-medium text-slate-700 leading-tight mt-1 break-words w-full line-clamp-2">Bugar</span>
                            </div>
                            <div onClick={() => navigateTo('pembayaran')} className="flex flex-col items-center text-center group cursor-pointer min-w-0 px-0.5">
                              <img src="/assets/images/icon_rehab.png" alt="NEW Rehab" className="w-10 h-10 object-contain shrink-0" />
                              <span className="text-[9.5px] font-medium text-slate-700 leading-tight mt-1 break-words w-full line-clamp-2">NEW Rehab</span>
                            </div>
                            <div onClick={() => navigateTo('ubah_data')} className="flex flex-col items-center text-center group cursor-pointer min-w-0 px-0.5">
                              <img src="/assets/images/icon_penambahan_peserta.png" alt="Penambahan" className="w-10 h-10 object-contain shrink-0" />
                              <span className="text-[9.5px] font-medium text-slate-700 leading-tight mt-1 break-words w-full line-clamp-2">Penambahan</span>
                            </div>
                            <div onClick={() => navigateTo('kartu')} className="flex flex-col items-center text-center group cursor-pointer min-w-0 px-0.5">
                              <img src="/assets/images/icon_info_peserta.png" alt="Info Peserta" className="w-10 h-10 object-contain shrink-0" />
                              <span className="text-[9.5px] font-medium text-slate-700 leading-tight mt-1 break-words w-full line-clamp-2">Info Peserta</span>
                            </div>
                            <div onClick={() => setToastMessage('Panggilan Darurat BPJS Care Center 165 terhubung (Bebas Pulsa 24 Jam).')} className="flex flex-col items-center text-center group cursor-pointer min-w-0 px-0.5">
                              <img src="/assets/images/icon_sos.png" alt="SOS" className="w-10 h-10 object-contain shrink-0" />
                              <span className="text-[9.5px] font-medium text-slate-700 leading-tight mt-1 break-words w-full line-clamp-2">SOS 165</span>
                            </div>
                            <div onClick={() => navigateTo('tempat_tidur')} className="flex flex-col items-center text-center group cursor-pointer min-w-0 px-0.5">
                              <img src="/assets/images/icon_lokasi_faskes.png" alt="Lokasi Faskes" className="w-10 h-10 object-contain shrink-0" />
                              <span className="text-[9.5px] font-medium text-slate-700 leading-tight mt-1 break-words w-full line-clamp-2">Info Faskes</span>
                            </div>
                            <div onClick={() => navigateTo('ubah_data')} className="flex flex-col items-center text-center group cursor-pointer min-w-0 px-0.5">
                              <img src="/assets/images/icon_perubahan_data.png" alt="Ubah Data" className="w-10 h-10 object-contain shrink-0" />
                              <span className="text-[9.5px] font-medium text-slate-700 leading-tight mt-1 break-words w-full line-clamp-2">Ubah Data</span>
                            </div>
                            <div onClick={() => navigateTo('pengaduan')} className="flex flex-col items-center text-center group cursor-pointer min-w-0 px-0.5">
                              <img src="/assets/images/icon_pengaduan.png" alt="Pengaduan" className="w-10 h-10 object-contain shrink-0" />
                              <span className="text-[9.5px] font-medium text-slate-700 leading-tight mt-1 break-words w-full line-clamp-2">Pengaduan</span>
                            </div>
                            <div onClick={() => navigateTo('more_menu')} className="flex flex-col items-center text-center group cursor-pointer min-w-0 px-0.5">
                              <img src="/assets/images/icon_menu_lainnya.png" alt="Lainnya" className="w-10 h-10 object-contain shrink-0" />
                              <span className="text-[9.5px] font-medium text-slate-700 leading-tight mt-1 break-words w-full line-clamp-2">Lainnya</span>
                            </div>
                          </div>

                          {/* Banner Carousel */}
                          <div className="relative rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                            <img 
                              src={bannerIdx === 0 ? "/assets/images/banner_pandawa.png" : "/assets/images/banner_janji_layanan.png"} 
                              alt="Banner JKN" 
                              className="w-full h-36 object-cover transition-all duration-500"
                            />
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
                              <div className={`w-2 h-2 rounded-full transition-all ${bannerIdx === 0 ? 'bg-emerald-600 w-4' : 'bg-white/70'}`} />
                              <div className={`w-2 h-2 rounded-full transition-all ${bannerIdx === 1 ? 'bg-emerald-600 w-4' : 'bg-white/70'}`} />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* OTHER SCREENS */}
                      {currentScreen === 'more_menu' && <MoreMenuScreen onNavigate={navigateTo} onOpenClaimTrace={() => setShowModal(true)} />}
                      {currentScreen === 'antrean' && <AntreanScreen onNavigate={navigateTo} />}
                      {currentScreen === 'riwayat' && <RiwayatPelayananScreen onNavigate={navigateTo} onOpenClaimTrace={() => setShowModal(true)} patientResponse={patientResponse} />}
                      {currentScreen === 'tempat_tidur' && <TempatTidurScreen onNavigate={navigateTo} />}
                      {currentScreen === 'chat_dokter' && <KonsultasiDokterScreen onNavigate={navigateTo} />}
                      {currentScreen === 'ubah_data' && <UbahDataScreen onNavigate={navigateTo} />}
                      {currentScreen === 'skrining' && <SkriningScreen onNavigate={navigateTo} />}
                      {currentScreen === 'pembayaran' && <PembayaranScreen onNavigate={navigateTo} />}
                      {currentScreen === 'pengaduan' && <PengaduanScreen onNavigate={navigateTo} />}
                      {currentScreen === 'bugar' && <BugarScreen onNavigate={navigateTo} />}
                      {currentScreen === 'obat' && <ObatScreen onNavigate={navigateTo} />}
                      
                      {/* KARTU DIGITAL KIS */}
                      {currentScreen === 'kartu' && (
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                          <div className="flex items-center space-x-2">
                            <button type="button" aria-label="Kembali ke beranda Mobile JKN" onClick={() => navigateTo('home')} className="p-1 text-slate-600 hover:text-black">
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <h2 className="text-sm font-bold text-slate-900">Kartu Peserta KIS Digital</h2>
                          </div>
                          <div className="relative w-full rounded-2xl overflow-hidden shadow-md border border-emerald-600/30">
                            <img src="/assets/images/kartu_kis_full.png" alt="Kartu KIS" className="w-full h-auto object-cover" />
                            <div className="absolute inset-0 p-5 flex flex-col justify-between text-slate-900 select-none">
                              <span className="text-[10px] font-bold text-emerald-800 tracking-wider">INDONESIA SEHAT</span>
                              <div className="space-y-1 my-auto pt-4">
                                <p className="text-[10px] text-slate-600 font-medium uppercase">Nama Peserta JKN-KIS</p>
                                <p className="text-sm font-bold text-slate-950 tracking-wide">AHMAD SYAFIQ</p>
                                <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
                                  <div>
                                    <span className="text-slate-500">Nomor Kartu:</span>
                                    <p className="font-bold font-mono text-slate-900">00014*****442</p>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">NIK Terenkripsi:</span>
                                    <p className="font-bold font-mono text-slate-900">3171************</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-between items-end border-t border-slate-200 pt-2">
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  STATUS: AKTIF
                                </span>
                                <QrCode className="w-7 h-7 text-slate-800" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* NOTIFIKASI */}
                      {currentScreen === 'notifikasi' && (
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                          <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
                            <button type="button" onClick={() => navigateTo('home')} aria-label="Kembali ke beranda Mobile JKN" className="p-1 text-slate-600 hover:text-black">
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <h2 className="text-sm font-bold text-slate-900">Pusat Notifikasi</h2>
                          </div>
                          <div 
                            onClick={() => setShowModal(true)}
                            className="p-3.5 rounded-2xl border cursor-pointer transition shadow-sm bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20"
                          >
                            <div className="flex items-start space-x-3">
                              <div className="bg-emerald-600 p-2 rounded-xl text-white shrink-0">
                                <Shield className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-emerald-800">VERIFIKASI PRESENSI</span>
                                  <span className="text-[9px] text-slate-400">Hari ini, 09:55</span>
                                </div>
                                <h4 className="text-xs font-bold text-slate-900 mt-0.5">Konfirmasi Layanan di RS Mitra Husada</h4>
                                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                                  Klaim diajukan atas nama Anda. Mohon konfirmasi apakah Anda benar menerima tindakan ini untuk memastikan validitas pembayaran.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* BERITA, FAQ, PROFIL */}
                      {currentScreen === 'berita' && (
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                          <h2 className="text-sm font-bold text-slate-900">Berita JKN</h2>
                          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 p-3">
                            <h4 className="text-xs font-bold text-slate-900">Optimalisasi Layanan Digital JKN</h4>
                            <p className="text-[11px] text-slate-600 mt-1">Kolaborasi peningkatan transparansi klaim bersama seluruh fasilitas kesehatan.</p>
                          </div>
                        </div>
                      )}

                      {(currentScreen === 'faq' || currentScreen === 'profil') && (
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                          <h2 className="text-sm font-bold text-slate-900 capitalize">{currentScreen}</h2>
                          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
                            <p>Nama: AHMAD SYAFIQ (Peserta Aktif JKN-KIS)</p>
                            <p>No. KIS: 00014*****442 (Terverifikasi)</p>
                            <p>Kantor Cabang Terdaftar: Kantor Cabang Utama BPJS Kesehatan (Nasional)</p>
                          </div>
                        </div>
                      )}
                      </Suspense>
                    </div>

                    {/* BOTTOM NAV BAR */}
                    <div className="relative bg-white border-t border-slate-200 px-3 py-2 flex items-center justify-between select-none z-20 shrink-0">
                      <button type="button" onClick={() => navigateTo('home')} className={`flex flex-col items-center w-12 ${activeTab === 'home' && currentScreen === 'home' ? 'text-[#0288D1]' : 'text-slate-400'}`}>
                        <Home className="w-5 h-5" />
                        <span className="text-[10px] font-bold mt-0.5">Home</span>
                      </button>
                      <button type="button" onClick={() => navigateTo('berita')} className={`flex flex-col items-center w-12 ${activeTab === 'berita' || currentScreen === 'berita' ? 'text-[#0288D1]' : 'text-slate-400'}`}>
                        <FileText className="w-5 h-5" />
                        <span className="text-[10px] font-medium mt-0.5">Berita</span>
                      </button>
                      <div className="relative -top-5 flex flex-col items-center">
                        <button type="button" aria-label="Buka Kartu KIS Digital" onClick={() => navigateTo('kartu')} className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#0288D1] to-[#00A65A] text-white flex items-center justify-center shadow-md border-4 border-white active:scale-95 transition">
                          <CreditCard className="w-6 h-6" />
                        </button>
                        <span className="text-[10px] font-bold mt-0.5 text-slate-600">Kartu</span>
                      </div>
                      <button type="button" onClick={() => navigateTo('faq')} className={`flex flex-col items-center w-12 ${activeTab === 'faq' || currentScreen === 'faq' ? 'text-[#0288D1]' : 'text-slate-400'}`}>
                        <HelpCircle className="w-5 h-5" />
                        <span className="text-[10px] font-medium mt-0.5">FAQ</span>
                      </button>
                      <button type="button" onClick={() => navigateTo('profil')} className={`flex flex-col items-center w-12 ${activeTab === 'profil' || currentScreen === 'profil' ? 'text-[#0288D1]' : 'text-slate-400'}`}>
                        <User className="w-5 h-5" />
                        <span className="text-[10px] font-medium mt-0.5">Profil</span>
                      </button>
                    </div>

                    {/* MODAL BOTTOM SHEET: KONFIRMASI PRESENSI (LAPIS 3) */}
                    <AnimatePresence>
                      {showModal && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="absolute inset-0 bg-black/50 z-50 flex flex-col justify-end p-2"
                        >
                          <motion.div 
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 26, stiffness: 320 }}
                            className="bg-white rounded-3xl p-4 shadow-2xl space-y-3.5 border border-slate-200"
                          >
                            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto" />
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-2.5">
                                <div className="bg-emerald-100 text-emerald-800 p-2 rounded-xl">
                                  <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                                    Konfirmasi Layanan JKN
                                  </h4>
                                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    Verifikasi Presensi Pasien · Lapis 3
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                aria-label="Tutup modal konfirmasi layanan"
                                className="p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-2 text-[11px]">
                              <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                                <span className="text-slate-500 font-medium">Fasilitas Kesehatan:</span>
                                <span className="font-bold text-slate-900">RS Khusus Mitra Husada</span>
                              </div>
                              <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                                <span className="text-slate-500 font-medium">Tanggal Layanan:</span>
                                <span className="font-bold text-slate-900">14 Oktober 2026</span>
                              </div>
                              <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                                <span className="text-slate-500 font-medium">Tindakan Medis:</span>
                                <span className="font-bold text-slate-900">Prosedur Fisioterapi (Z-3-12-0)</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium">DPJP:</span>
                                <span className="font-bold text-slate-900">dr. Hendra, Sp.KFR</span>
                              </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl text-center">
                              <p className="text-xs font-bold text-blue-950">
                                "Apakah Anda benar hadir secara langsung dan menerima tindakan medis tersebut pada tanggal yang tertera?"
                              </p>
                              <p className="text-[10px] text-blue-700 mt-1">
                                Konfirmasi Anda melindungi dana jaminan sosial kesehatan dan mencegah klaim fiktif.
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5 pt-1">
                              <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={() => handlePatientAnswer('denied')}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm transition"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>Tidak Pernah</span>
                              </motion.button>
                              <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={() => handlePatientAnswer('confirmed')}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm transition"
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span>Ya, Saya Hadir</span>
                              </motion.button>
                            </div>
                            <p className="text-[9px] text-center text-slate-500">
                              Pemberitahuan resmi dilindungi sesuai UU Perlindungan Data Pribadi No. 27 Tahun 2022.
                            </p>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SISI KANAN: DASHBOARD VERIFIKATOR BPJS (10 MODUL)        */}
            {/* ======================================================== */}
            {(viewMode === 'split' || viewMode === 'dashboard') && (
              <div className={`flex flex-col space-y-4 ${
                viewMode === 'split' ? 'flex-1 min-w-0' : 'w-full'
              }`}>

                {/* ACTIVE WORKSPACE BREADCRUMB & CASE CONTEXT STRIP */}
                <div className={`flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2 rounded-xl border text-xs transition-colors ${
                  isLight
                    ? 'bg-white/95 border-slate-200 text-slate-700 shadow-2xs'
                    : 'bg-[#0E1116]/90 border-white/10 text-slate-200'
                }`}>
                  <nav aria-label="Breadcrumb Portal Verifikator" className="flex items-center gap-1.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => setDashboardTab('executive')}
                      className={`font-semibold transition cursor-pointer ${
                        isLight ? 'text-emerald-700 hover:text-emerald-900' : 'text-emerald-400 hover:text-emerald-300'
                      }`}
                    >
                      Portal Verifikator
                    </button>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                    <span className={`truncate hidden sm:inline ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {activeNavGroup?.group}
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 hidden sm:inline ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                    <span className={`font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {activeNavItem?.label}
                    </span>
                  </nav>

                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedCase ? (
                      <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[11px] ${
                        isLight
                          ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                      }`}>
                        <span className="font-mono font-bold tabular-nums">{selectedCase.id}</span>
                        {selectedCase.hospital && (
                          <span className={`hidden md:inline truncate max-w-[180px] ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                            · {selectedCase.hospital}
                          </span>
                        )}
                        <div className="flex items-center gap-1 pl-1 border-l border-emerald-500/30">
                          <button
                            type="button"
                            onClick={() => setDashboardTab('investigation', 'audit')}
                            className={`px-1.5 py-0.5 rounded font-semibold transition cursor-pointer ${
                              dashboardTab === 'investigation' && hubSubTabs.investigation === 'audit'
                                ? (isLight ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-slate-950')
                                : (isLight ? 'hover:bg-emerald-100 text-emerald-800' : 'hover:bg-white/10 text-emerald-300')
                            }`}
                          >
                            Telaah
                          </button>
                          <button
                            type="button"
                            onClick={() => setDashboardTab('document_checker')}
                            className={`px-1.5 py-0.5 rounded font-semibold transition cursor-pointer ${
                              dashboardTab === 'investigation' && hubSubTabs.investigation === 'dokumen'
                                ? (isLight ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-slate-950')
                                : (isLight ? 'hover:bg-emerald-100 text-emerald-800' : 'hover:bg-white/10 text-emerald-300')
                            }`}
                          >
                            7 Dokumen
                          </button>
                          <button
                            type="button"
                            onClick={() => setDashboardTab('decision')}
                            className={`px-1.5 py-0.5 rounded font-semibold transition cursor-pointer ${
                              dashboardTab === 'decision'
                                ? (isLight ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-slate-950')
                                : (isLight ? 'hover:bg-emerald-100 text-emerald-800' : 'hover:bg-white/10 text-emerald-300')
                            }`}
                          >
                            Putusan
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedCase(null)}
                            aria-label="Lepas berkas aktif"
                            title="Lepas berkas aktif"
                            className={`p-1.5 min-w-[26px] min-h-[26px] flex items-center justify-center rounded transition cursor-pointer ${
                              isLight ? 'text-slate-600 hover:bg-rose-100 hover:text-rose-700' : 'text-slate-300 hover:bg-rose-500/20 hover:text-rose-300'
                            }`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => {
                        if (isMobileViewport) {
                          setSidebarCollapsed(true);
                        }
                        setCommandPaletteOpen(true);
                      }}
                      aria-label="Buka navigasi cepat semua modul portal"
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer shrink-0 ${
                        isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                      }`}
                    >
                      <Search className="w-3 h-3" />
                      <span className="hidden sm:inline">Semua Modul ({sidebarNavItems.length})</span>
                      <span className="sm:hidden">Modul ({sidebarNavItems.length})</span>
                      <span className={`hidden sm:inline font-mono text-[10px] px-1 rounded ${isLight ? 'bg-slate-200/80 text-slate-700' : 'bg-white/10 text-slate-300'}`}>Ctrl+K</span>
                    </button>
                  </div>
                </div>
                
                {/* ACTIVE MODULE VIEW RENDERER WITH MOTION TRANSITION */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={dashboardTab}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="w-full space-y-4"
                  >
                    <TabErrorBoundary
                      resetKey={dashboardTab}
                      isLight={isLight}
                      moduleLabel={activeNavItem?.label}
                      onGoHome={() => setDashboardTab('executive')}
                    >
                    <Suspense
                      fallback={
                        <div className={`rounded-2xl border p-8 flex flex-col items-center justify-center gap-3 ${
                          isLight ? 'bg-white border-slate-200 text-slate-600 shadow-sm' : 'bg-[#00153A]/70 border-white/10 text-slate-300'
                        }`}>
                          <div className="w-7 h-7 rounded-full border-2 border-emerald-500/25 border-t-emerald-600 animate-spin" />
                          <span className="text-xs font-medium tracking-wide">Memuat modul analitik...</span>
                        </div>
                      }
                    >
                    {dashboardTab === 'executive' && (
                      <ExecutiveHub 
                        isLight={isLight}
                        onNavigateToQueue={() => setDashboardTab('queue')}
                        onNavigateToEmpirical={() => setDashboardTab('empirical')}
                        onNavigateTab={(t) => {
                          if (t === 'verification') setDashboardTab('decision');
                          else setDashboardTab(t);
                        }}
                        onInspectCase={(cId) => {
                          setSelectedCase({ id: cId });
                          setDashboardTab('investigation');
                        }}
                        onSelectCriticalCase={(cId) => {
                          setSelectedCase({ id: cId });
                          setDashboardTab('investigation');
                        }}
                      />
                    )}

                    {dashboardTab === 'queue' && (
                      <WorkspaceHubShell
                        isLight={isLight}
                        ariaLabel="Sub-navigasi Antrean dan Berkas Klaim"
                        activeSubTab={hubSubTabs.queue}
                        onChangeSubTab={(sub) => setHubSubTab('queue', sub)}
                        tabs={[
                          {
                            id: 'priority',
                            label: 'Antrean Prioritas',
                            icon: ListFilter,
                            badge: (sidebarBadges.total_claims ?? sidebarBadges.pending_cases) != null ? String(sidebarBadges.total_claims ?? sidebarBadges.pending_cases) : undefined,
                          },
                          { id: 'quick', label: 'Triase Cepat', icon: ClipboardList },
                          { id: 'files', label: 'Manajemen Berkas', icon: Briefcase },
                          { id: 'flagged', label: 'Berkas Ditandai', icon: Flag },
                        ]}
                      >
                        {hubSubTabs.queue === 'priority' && (
                          <TriageOverview
                            onSelectCase={(c) => {
                              setSelectedCase(c);
                              setDashboardTab('investigation', 'audit');
                            }}
                            onNavigateTab={(t) => setDashboardTab(t)}
                            onOpenWorkflowMap={() => setWorkflowMapOpen(true)}
                            isLight={isLight}
                            initialSearchQuery={globalSearchQuery}
                          />
                        )}
                        {hubSubTabs.queue === 'quick' && (
                          <QuickTriageView
                            isLight={isLight}
                            onNavigateTab={(t) => setDashboardTab(t)}
                            onSelectCase={(cId) => {
                              setSelectedCase({ id: cId });
                              setDashboardTab('investigation', 'audit');
                            }}
                          />
                        )}
                        {hubSubTabs.queue === 'files' && (
                          <CasesManagementView
                            isLight={isLight}
                            onNavigateTab={(t) => setDashboardTab(t)}
                            onInspectCase={(cId) => {
                              setSelectedCase({ id: cId });
                              setDashboardTab('investigation', 'audit');
                            }}
                            onSelectCase={(cId) => {
                              setSelectedCase({ id: cId });
                              setDashboardTab('investigation', 'audit');
                            }}
                          />
                        )}
                        {hubSubTabs.queue === 'flagged' && (
                          <FlaggedSessionsView
                            isLight={isLight}
                            onNavigateTab={(t) => setDashboardTab(t)}
                            onSelectCase={(cId) => {
                              setSelectedCase({ id: cId });
                              setDashboardTab('investigation', 'audit');
                            }}
                          />
                        )}
                      </WorkspaceHubShell>
                    )}

                    {dashboardTab === 'investigation' && (
                      <WorkspaceHubShell
                        isLight={isLight}
                        ariaLabel="Sub-navigasi Telaah Kasus dan Dokumen RS"
                        activeSubTab={hubSubTabs.investigation}
                        onChangeSubTab={(sub) => setHubSubTab('investigation', sub)}
                        tabs={[
                          { id: 'audit', label: 'Audit 4-Lapis & Klinis', icon: FileText },
                          { id: 'dokumen', label: 'Cek 7 Dokumen & ICD-10', icon: FileCheck2 },
                        ]}
                      >
                        {hubSubTabs.investigation === 'audit' && (
                          <CaseInvestigation
                            caseData={selectedCase}
                            s1={selectedCase?.s1 ?? s1}
                            s2={selectedCase?.s2 ?? s2}
                            s3={selectedCase && patientResponse === null ? (selectedCase.s3 ?? s3) : s3}
                            patientResponse={patientResponse}
                            onBackToQueue={() => setDashboardTab('queue', 'priority')}
                            onOpenDecision={() => setDashboardTab('decision')}
                            onOpenDocumentChecker={() => setDashboardTab('document_checker')}
                            onNavigateTab={(t) => setDashboardTab(t)}
                            onOpenWorkflowMap={() => setWorkflowMapOpen(true)}
                            isLight={isLight}
                          />
                        )}
                        {hubSubTabs.investigation === 'dokumen' && (
                          <DocumentCheckerView
                            isLight={isLight}
                            currentUser={currentUser}
                            initialClaimId={selectedCase?.id}
                            onSelectClaim={(claimObj) => {
                              if (claimObj?.id) setSelectedCase(claimObj);
                            }}
                          />
                        )}
                      </WorkspaceHubShell>
                    )}

                    {dashboardTab === 'faskes' && (
                      <WorkspaceHubShell
                        isLight={isLight}
                        ariaLabel="Sub-navigasi Pengawasan Faskes dan DPJP"
                        activeSubTab={hubSubTabs.faskes}
                        onChangeSubTab={(sub) => setHubSubTab('faskes', sub)}
                        tabs={[
                          { id: 'surveillance', label: 'Profil Risiko Faskes', icon: Activity },
                          { id: 'ranking', label: 'Peringkat & Kohort RS', icon: Building2 },
                          { id: 'dpjp', label: 'Intelijen DPJP & SIP', icon: Stethoscope },
                          { id: 'retention', label: 'Kepatuhan & Retensi', icon: Users },
                        ]}
                      >
                        {hubSubTabs.faskes === 'surveillance' && (
                          <FaskesSurveillance
                            isLight={isLight}
                            onSelectFaskesCase={(cId) => {
                              setSelectedCase(buildMitraCaseFallback(cId));
                              setDashboardTab('investigation', 'audit');
                            }}
                            onSelectHospital={() => {}}
                            onNavigateTab={(t) => setDashboardTab(t)}
                            onOpenWorkflowMap={() => setWorkflowMapOpen(true)}
                          />
                        )}
                        {hubSubTabs.faskes === 'ranking' && (
                          <FraudRankingView
                            isLight={isLight}
                            onSelectFaskes={() => setHubSubTab('faskes', 'surveillance')}
                          />
                        )}
                        {hubSubTabs.faskes === 'dpjp' && (
                          <DpjpIntelligence
                            isLight={isLight}
                            onSelectCase={(cId) => {
                              setSelectedCase(buildDpjpCaseFallback(cId));
                              setDashboardTab('investigation', 'audit');
                            }}
                          />
                        )}
                        {hubSubTabs.faskes === 'retention' && (
                          <RetentionAnalyticsView
                            isLight={isLight}
                            onNavigateTab={(t) => setDashboardTab(t)}
                          />
                        )}
                      </WorkspaceHubShell>
                    )}

                    {dashboardTab === 'empirical' && (
                      <WorkspaceHubShell
                        isLight={isLight}
                        ariaLabel="Sub-navigasi Forensik Statistik dan Gudang Data"
                        activeSubTab={hubSubTabs.empirical}
                        onChangeSubTab={(sub) => setHubSubTab('empirical', sub)}
                        tabs={[
                          { id: 'benford', label: 'Benford, Gini & Anomali', icon: Zap },
                          { id: 'trends', label: 'Tren & Privasi Analitik', icon: Sparkles },
                          { id: 'sql', label: 'Gudang Data SQL', icon: Database },
                        ]}
                      >
                        {hubSubTabs.empirical === 'benford' && (
                          <EmpiricalForensics
                            isLight={isLight}
                            onInspectCase={(c) => {
                              setSelectedCase({
                                id: c.claim_1,
                                sep: c.claim_1,
                                hospital: c.faskes_owner_1,
                                hospitalType: 'FKRTL (Data Transaksi Resmi BPJS Kesehatan)',
                                code: c.cbg_1,
                                description: c.cbg_desc_1,
                                tariff: `Rp ${c.total_biaya.toLocaleString('id-ID')}`,
                                dpjp: 'DPJP Terdaftar FKRTL',
                                sipNumber: '446.1/108/DPJP/2023',
                                sampleCount: 10,
                                participantCount: 10,
                                deniedCount: 8,
                                batchTag: 'REPEAT_SAMEDAY_2024',
                                s1: 85,
                                s2: 80,
                                s3: 75,
                                totalScore: 81.5,
                                lane: 'red',
                                status: 'AUDIT REPEAT MERAH',
                                date: c.tgl_masuk,
                                notes: `${c.modus}. Pasangan klaim ${c.claim_1} dan ${c.claim_2} diajukan pada hari sama.`,
                                flags: ['REPEAT BILLING', 'SAME-DAY SPLIT'],
                              });
                              setDashboardTab('investigation', 'audit');
                            }}
                          />
                        )}
                        {hubSubTabs.empirical === 'trends' && (
                          <InsightsAnalyticsView
                            isLight={isLight}
                            onNavigateTab={(t) => setDashboardTab(t)}
                          />
                        )}
                        {hubSubTabs.empirical === 'sql' && (
                          <DatabaseViewerView isLight={isLight} />
                        )}
                      </WorkspaceHubShell>
                    )}

                    {dashboardTab === 'mobile_bridge' && (
                      <WorkspaceHubShell
                        isLight={isLight}
                        ariaLabel="Sub-navigasi Klarifikasi dan Mobile JKN"
                        activeSubTab={hubSubTabs.mobile_bridge}
                        onChangeSubTab={(sub) => setHubSubTab('mobile_bridge', sub)}
                        tabs={[
                          { id: 'telemetry', label: 'Telemetri Mobile JKN', icon: Smartphone },
                          { id: 'schedule', label: 'Jadwal Klarifikasi RS', icon: Calendar },
                          { id: 'dialog', label: 'Konfirmasi Peserta', icon: MessageSquare },
                          { id: 'interventions', label: 'Intervensi FKRTL', icon: ShieldCheck },
                        ]}
                      >
                        {hubSubTabs.mobile_bridge === 'telemetry' && (
                          <MobileTelemetry
                            onTriggerPush={triggerSimulation}
                            onToggleSimulator={toggleSimulation}
                            onCloseSimulator={closeSimulator}
                            isSimulatorOpen={viewMode === 'split' || viewMode === 'mobile'}
                            patientResponse={patientResponse}
                            onResetPresensi={resetPresensiSession}
                            isLight={isLight}
                          />
                        )}
                        {hubSubTabs.mobile_bridge === 'schedule' && (
                          <ClarificationScheduleView
                            isLight={isLight}
                            onNavigateTab={(t) => setDashboardTab(t)}
                            onSelectCase={(cId) => {
                              setSelectedCase({ id: cId });
                              setDashboardTab('investigation', 'audit');
                            }}
                          />
                        )}
                        {hubSubTabs.mobile_bridge === 'dialog' && (
                          <ConversationsView
                            isLight={isLight}
                            onSelectCase={(cId) => {
                              setSelectedCase(buildMitraCaseFallback(cId));
                              setDashboardTab('investigation', 'audit');
                            }}
                          />
                        )}
                        {hubSubTabs.mobile_bridge === 'interventions' && (
                          <InterventionsView
                            isLight={isLight}
                            onSelectCase={(cId) => {
                              setSelectedCase(buildMitraCaseFallback(cId));
                              setDashboardTab('investigation', 'audit');
                            }}
                          />
                        )}
                      </WorkspaceHubShell>
                    )}

                    {dashboardTab === 'decision' && (
                      <DecisionConsole
                        caseData={selectedCase}
                        totalScore={selectedCase?.totalScore ?? totalScore}
                        s1={selectedCase?.s1 ?? s1}
                        s2={selectedCase?.s2 ?? s2}
                        s3={selectedCase && patientResponse === null ? (selectedCase.s3 ?? s3) : s3}
                        patientResponse={patientResponse}
                        verificatorAction={verificatorAction}
                        onSetVerificatorAction={setVerificatorAction}
                        onBackToInvestigation={() => setDashboardTab('investigation', 'audit')}
                        onBackToQueue={() => setDashboardTab('queue', 'priority')}
                        onNavigateTab={(t) => setDashboardTab(t)}
                        onOpenWorkflowMap={() => setWorkflowMapOpen(true)}
                        currentUser={currentUser}
                        isLight={isLight}
                      />
                    )}

                    {dashboardTab === 'official_reports' && (
                      <WorkspaceHubShell
                        isLight={isLight}
                        ariaLabel="Sub-navigasi Laporan Resmi dan Jejak Audit"
                        activeSubTab={hubSubTabs.official_reports}
                        onChangeSubTab={(sub) => setHubSubTab('official_reports', sub)}
                        tabs={[
                          { id: 'reports', label: 'Berita Acara Resmi (BAHV / SP-1)', icon: Printer },
                          { id: 'ledger', label: 'Jejak Audit SHA-256', icon: Key },
                        ]}
                      >
                        {hubSubTabs.official_reports === 'reports' && (
                          <OfficialReportsView
                            onBack={() => setDashboardTab('decision')}
                            isLight={isLight}
                            currentUser={currentUser}
                            selectedCase={selectedCase}
                          />
                        )}
                        {hubSubTabs.official_reports === 'ledger' && (
                          <AuditLedger isLight={isLight} />
                        )}
                      </WorkspaceHubShell>
                    )}

                    {dashboardTab === 'health_ai_chat' && (
                      <HealthAIChatView
                        onNavigateTab={(tab) => setDashboardTab(tab)}
                        currentUser={currentUser}
                        isLight={isLight}
                      />
                    )}

                    {dashboardTab === 'settings' && (
                      <WorkspaceHubShell
                        isLight={isLight}
                        ariaLabel="Sub-navigasi Pengaturan dan Akun Verifikator"
                        activeSubTab={hubSubTabs.settings}
                        onChangeSubTab={(sub) => setHubSubTab('settings', sub)}
                        tabs={[
                          { id: 'preferences', label: 'Preferensi & Ambang Sistem', icon: Settings },
                          { id: 'profile', label: 'Profil & Keamanan Sesi', icon: User },
                        ]}
                      >
                        {hubSubTabs.settings === 'preferences' && (
                          <AdminSettingsView
                            currentTheme={theme}
                            onThemeChange={setTheme}
                            onBackToDashboard={() => setDashboardTab('executive')}
                            isLight={isLight}
                          />
                        )}
                        {hubSubTabs.settings === 'profile' && (
                          <AdminProfileView
                            currentUser={currentUser}
                            onUpdateUser={(updated) => setCurrentUser(updated)}
                            onBackToDashboard={() => setDashboardTab('executive')}
                            isLight={isLight}
                          />
                        )}
                      </WorkspaceHubShell>
                    )}
                    </Suspense>
                    </TabErrorBoundary>
                  </motion.div>
                </AnimatePresence>

              </div>
            )}

          </div>
        </main>
      </div>

      {/* PALET PERINTAH NAVIGASI PORTAL (CTRL+K) */}
      <AnimatePresence>
        {commandPaletteOpen && typeof document !== 'undefined' && createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCommandPaletteOpen(false)}
            className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 px-4"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Navigasi Cepat Portal Verifikator"
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.14 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0E1116] border-white/15 text-slate-100'
              }`}
            >
              <div className={`px-4 py-3 border-b flex items-center gap-2.5 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
              }`}>
                <Search className={`w-4 h-4 shrink-0 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                <input
                  id="command-palette-search-input"
                  name="command_palette_query"
                  aria-label="Cari modul atau nomor SEP di seluruh portal"
                  type="text"
                  autoFocus
                  value={commandPaletteQuery}
                  onChange={(e) => setCommandPaletteQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (e.nativeEvent?.isComposing || e.isComposing || e.keyCode === 229) {
                        return;
                      }
                      const q = commandPaletteQuery.trim().toLowerCase();
                      const match = allSearchableItems.find((m) =>
                        `${m.label} ${m.keywords || ''} ${m.id}`.toLowerCase().includes(q)
                      );
                      if (match) {
                        setDashboardTab(match.id);
                      } else if (q) {
                        setGlobalSearchQuery(commandPaletteQuery.trim());
                        setDashboardTab('queue', 'priority');
                      }
                      setCommandPaletteOpen(false);
                    }
                  }}
                  placeholder="Ketik nama modul (mis. Benford, BAHV, FHIR, Sesi) atau No. SEP..."
                  className={`flex-1 bg-transparent border-none outline-none text-sm focus:ring-0 ${
                    isLight ? 'text-slate-900 placeholder-slate-500' : 'text-white placeholder-slate-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setCommandPaletteOpen(false)}
                  aria-label="Tutup navigasi cepat"
                  className={`px-2 py-0.5 rounded border text-[10px] font-mono cursor-pointer ${
                    isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-white/5 border-white/15 text-slate-300'
                  }`}
                >
                  ESC
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-2.5 space-y-3">
                {commandPaletteGroups.map((grp) => {
                  const q = commandPaletteQuery.trim().toLowerCase();
                  const matches = grp.items.filter((it) =>
                    !q || `${it.label} ${it.keywords || ''} ${it.id}`.toLowerCase().includes(q)
                  );
                  if (matches.length === 0) return null;
                  return (
                    <div key={grp.group} className="space-y-1">
                      <p className={`px-2.5 text-[10px] font-bold uppercase tracking-wider ${
                        isLight ? 'text-slate-600' : 'text-slate-400'
                      }`}>
                        {grp.group}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {matches.map((it) => {
                          const Icon = it.icon;
                          const resolvedTarget = LEGACY_TAB_MAP[it.id] || { tab: it.id };
                          const isCurrent =
                            dashboardTab === resolvedTarget.tab &&
                            (!resolvedTarget.sub || hubSubTabs[resolvedTarget.tab] === resolvedTarget.sub);
                          return (
                            <button
                              key={it.id}
                              type="button"
                              onClick={() => {
                                setDashboardTab(it.id);
                                setCommandPaletteOpen(false);
                                setCommandPaletteQuery('');
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition cursor-pointer border ${
                                isCurrent
                                  ? (isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-950 font-semibold' : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200 font-semibold')
                                  : (isLight ? 'bg-white border-transparent hover:bg-slate-100 text-slate-800' : 'bg-transparent border-transparent hover:bg-white/5 text-slate-200')
                              }`}
                            >
                              <span className="flex items-center gap-2 min-w-0">
                                <Icon className={`w-4 h-4 shrink-0 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                                <span className="truncate">{it.label}</span>
                              </span>
                              <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>

      {/* FOOTER (CLEAN SINGLE-ROW ENTERPRISE STATUS STRIP) */}
      <footer className={`py-2 px-4 flex flex-col lg:flex-row items-center justify-between text-[11px] gap-2 shrink-0 z-20 select-none transition-colors ${
        isLight
          ? 'bg-white/95 border-t border-slate-200 text-slate-600 shadow-xs'
          : 'bg-[#000c24]/90 backdrop-blur-md border-t border-white/10 text-white/55'
      }`}>
        <div className="flex items-center gap-2 min-w-0 flex-wrap lg:flex-nowrap">
          <span className={`font-display font-bold whitespace-nowrap ${isLight ? 'text-slate-900' : 'text-white'}`}>ClaimTrace © 2026</span>
          <span className={isLight ? 'text-slate-300' : 'text-white/25'}>·</span>
          <span className={`truncate ${isLight ? 'text-slate-600' : 'text-white/70'}`}>Pengawasan Pra-Bayar Klaim BPJS Kesehatan</span>
          <span className={`hidden xl:inline text-[11px] font-normal whitespace-nowrap ${
            isLight ? 'text-slate-500' : 'text-white/50'
          }`}>
            · Kedeputian Pengawasan &amp; Pemeriksaan
          </span>
          <span className={isLight ? 'text-slate-300' : 'text-white/25'}>·</span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            isLight
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
          }`}>
            DATA SINTETIK / BENCHMARK FIKTIF · UU PDP NO. 27/2022
          </span>
        </div>
      </footer>
    </motion.div>
      ) : authView === 'dashboard' ? (
        <motion.div
          key="session-verifying"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 h-dvh flex flex-col items-center justify-center px-6 ${
            isLight ? 'bg-[#F7F8FA] text-[#061B31]' : 'bg-[#090B0E] text-[#F3F5F8]'
          }`}
        >
          <div className={`max-w-md w-full rounded-2xl border p-6 text-center shadow-sm ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#11141A] border-white/10'
          }`}>
            <div className={`w-11 h-11 rounded-full mx-auto mb-3.5 flex items-center justify-center border ${
              isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            }`}>
              <ShieldCheck className="w-5 h-5 animate-pulse" />
            </div>
            <h2 className="text-sm font-bold tracking-tight">Memverifikasi Otoritas Sesi &amp; MFA</h2>
            <p className={`text-xs mt-1.5 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Mengonfirmasi token kriptografis, sidik perangkat kerja, dan masa aktif sesi ke server ClaimTrace JKN.
            </p>
            <button
              type="button"
              onClick={() => {
                clearSessionStorage({ broadcast: false });
                setAuthStatusVerified(false);
                setCurrentUser(null);
                setAuthView('login');
              }}
              className={`mt-4 px-4 py-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
              }`}
            >
              Kembali ke Halaman Login
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>

    {/* RUNTIME WEB ANALYTICS */}
    {import.meta.env.PROD &&
      typeof window !== 'undefined' &&
      !['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname) && <Analytics />}
  </>
      </GrowthBookProvider>
    </StatsigProvider>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, Search, Shield, ShieldCheck, AlertTriangle, CheckCircle, XCircle, 
  ChevronRight, ArrowRight, ArrowLeft, Activity, FileText, User, 
  HelpCircle, Home, Smartphone, Monitor, RefreshCw, Lock,
  Clock, Hospital, Stethoscope, AlertOctagon, Download, Eye, Check, X,
  Share2, Mail, Printer, QrCode, CreditCard, ChevronLeft, Info,
  PhoneCall, Heart, ListFilter, GitBranch, Database, ShieldAlert,
  Radio, Key, LayoutDashboard, Building2, UserCheck, Layers,
  ChevronDown, LogOut, PanelLeftClose, PanelLeft, ExternalLink, Bot,
  EyeOff, RotateCcw, Settings, Briefcase, Zap, Flag, Calendar,
  Users, MessageSquare, ClipboardList, Sparkles, Sun, Moon
} from 'lucide-react';

// Mobile JKN Screens
import MoreMenuScreen from './components/MobileJKN/MoreMenuScreen';
import AntreanScreen from './components/MobileJKN/AntreanScreen';
import RiwayatPelayananScreen from './components/MobileJKN/RiwayatPelayananScreen';
import TempatTidurScreen from './components/MobileJKN/TempatTidurScreen';
import KonsultasiDokterScreen from './components/MobileJKN/KonsultasiDokterScreen';
import UbahDataScreen from './components/MobileJKN/UbahDataScreen';
import SkriningScreen from './components/MobileJKN/SkriningScreen';
import PembayaranScreen from './components/MobileJKN/PembayaranScreen';
import PengaduanScreen from './components/MobileJKN/PengaduanScreen';
import BugarScreen from './components/MobileJKN/BugarScreen';
import ObatScreen from './components/MobileJKN/ObatScreen';

// Public & Auth Components
import LandingPage from './components/Public/LandingPage';
import SignInPage from './components/Auth/SignInPage';
import MfaStepUpPage from './components/Auth/MfaStepUpPage';
import SignOutPage from './components/Auth/SignOutPage';
import InstitutionalLegalModal from './components/Public/InstitutionalLegalModal';
import CookieConsentBanner from './components/Public/CookieConsentBanner';

// Forensic Cockpit Modules
import ExecutiveHub from './components/Dashboard/ExecutiveHub';
import TriageOverview from './components/Dashboard/TriageOverview';
import CaseInvestigation from './components/Dashboard/CaseInvestigation';
import GraphVisualizer from './components/Dashboard/GraphVisualizer';
import EmpiricalForensics from './components/Dashboard/EmpiricalForensics';
import FaskesSurveillance from './components/Dashboard/FaskesSurveillance';
import DpjpIntelligence from './components/Dashboard/DpjpIntelligence';
import MobileTelemetry from './components/Dashboard/MobileTelemetry';
import DecisionConsole from './components/Dashboard/DecisionConsole';
import AuditLedger from './components/Dashboard/AuditLedger';
import AgentCopilot from './components/Dashboard/AgentCopilot';
import AdminProfileView from './components/Dashboard/AdminProfileView';
import AdminSettingsView from './components/Dashboard/AdminSettingsView';
import InsightsAnalyticsView from './components/Dashboard/InsightsAnalyticsView';
import RetentionAnalyticsView from './components/Dashboard/RetentionAnalyticsView';
import CasesManagementView from './components/Dashboard/CasesManagementView';
import QuickTriageView from './components/Dashboard/QuickTriageView';
import FlaggedSessionsView from './components/Dashboard/FlaggedSessionsView';
import ClarificationScheduleView from './components/Dashboard/ClarificationScheduleView';
import CommandCenterView from './components/Dashboard/CommandCenterView';
import ConversationsView from './components/Dashboard/ConversationsView';
import InterventionsView from './components/Dashboard/InterventionsView';
import DatabaseViewerView from './components/Dashboard/DatabaseViewerView';
import HealthAIChatView from './components/Dashboard/HealthAIChatView';
import HealthAIChatWidget from './components/Dashboard/HealthAIChatWidget';

export default function App() {
  // Read initial view & tab from URL params for instant navigation & deep-linking
  const getInitialView = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('view') || window.location.hash.replace('#', '');
      if (v === 'health_ai') return 'dashboard';
      if (['landing', 'login', 'mfa', 'logout', 'dashboard'].includes(v)) {
        return v;
      }
    }
    return 'landing';
  };

  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('view');
      if (v === 'health_ai') return 'health_ai_chat';
      const t = params.get('tab');
      if (['executive', 'insights', 'retention', 'cases_mgmt', 'quick_triage', 'flagged_sessions', 'appointments', 'command_center', 'conversations', 'interventions', 'database_viewer', 'queue', 'investigation', 'agent_copilot', 'health_ai_chat', 'graph', 'empirical', 'faskes', 'dpjp', 'mobile_bridge', 'decision', 'audit', 'profile', 'settings'].includes(t)) {
        return t;
      }
    }
    return 'executive';
  };

  // Global View Router: 'landing' | 'login' | 'mfa' | 'logout' | 'dashboard'
  const [authView, setAuthView] = useState(getInitialView);

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
  
  // Tab aktif di Dashboard Cockpit (11 Modules):
  // 'executive' | 'queue' | 'investigation' | 'agent_copilot' | 'graph' | 'empirical' | 'faskes' | 'dpjp' | 'mobile_bridge' | 'decision' | 'audit'
  const [dashboardTab, setDashboardTab] = useState(getInitialTab);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

  // Institutional Legal & Compliance Modal State (UU PDP, Terms, Security, SLA)
  const getInitialLegalModal = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const m = params.get('modal') || params.get('legal');
      if (['privacy', 'terms', 'security', 'sla'].includes(m)) {
        return { isOpen: true, tab: m };
      }
    }
    return { isOpen: false, tab: 'privacy' };
  };

  const [legalModalOpen, setLegalModalOpen] = useState(() => getInitialLegalModal().isOpen);
  const [legalModalTab, setLegalModalTab] = useState(() => getInitialLegalModal().tab);

  const openLegalModal = (tab = 'privacy') => {
    setLegalModalTab(tab);
    setLegalModalOpen(true);
  };

  // Sync state to URL for easy deep-linking and state preservation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('view', authView);
      if (authView === 'dashboard') {
        url.searchParams.set('tab', dashboardTab);
        if (viewMode !== 'dashboard') {
          url.searchParams.set('mode', viewMode);
        } else {
          url.searchParams.delete('mode');
        }
      } else {
        url.searchParams.delete('tab');
        url.searchParams.delete('mode');
      }
      window.history.replaceState(null, '', url.toString());
    }
  }, [authView, dashboardTab, viewMode]);

  // Handle browser Back & Forward navigation buttons (popstate synchronization)
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const v = params.get('view') || window.location.hash.replace('#', '') || 'landing';
        if (['landing', 'login', 'mfa', 'logout', 'dashboard'].includes(v)) {
          setAuthView(v);
        }
        const t = params.get('tab');
        if (t && ['executive', 'insights', 'retention', 'cases_mgmt', 'quick_triage', 'flagged_sessions', 'appointments', 'command_center', 'conversations', 'interventions', 'database_viewer', 'queue', 'investigation', 'agent_copilot', 'health_ai_chat', 'graph', 'empirical', 'faskes', 'dpjp', 'mobile_bridge', 'decision', 'audit', 'profile', 'settings'].includes(t)) {
          setDashboardTab(t);
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

  // Navigasi Cockpit Sidebar Dikelompokkan Rapi
  const sidebarNavGroups = [
    {
      group: 'Ringkasan & Analitik',
      items: [
        { id: 'executive', label: 'Tinjauan Eksekutif', icon: LayoutDashboard },
        { id: 'insights', label: 'Wawasan Analitik (IA)', icon: Shield },
        { id: 'retention', label: 'Kohort & Retensi Audit', icon: Activity },
      ],
    },
    {
      group: 'Triase & Berkas Klaim',
      items: [
        { id: 'queue', label: 'Antrean Triase Klaim', icon: ListFilter, badge: '85', badgeColor: 'bg-rose-50 text-rose-700 border-rose-200' },
        { id: 'cases_mgmt', label: 'Berkas Klaim (Cases)', icon: Briefcase },
        { id: 'quick_triage', label: 'Triase Cepat (Quick)', icon: Zap },
        { id: 'flagged_sessions', label: 'Sesi Ditandai (Flags)', icon: Flag, badge: '5', badgeColor: 'bg-amber-50 text-amber-800 border-amber-200' },
        { id: 'appointments', label: 'Jadwal Klarifikasi DPJP', icon: Calendar },
      ],
    },
    {
      group: 'Forensik Bukti 3 Lapis',
      items: [
        { id: 'investigation', label: 'Matriks 3 Lapis Bukti', icon: FileText, badge: 'Kritis', badgeColor: 'bg-rose-100 text-rose-800 border-rose-200' },
        { id: 'graph', label: 'Peta Sindikat Faskes', icon: GitBranch },
        { id: 'empirical', label: 'Forensik Data Empiris', icon: Database },
        { id: 'faskes', label: 'Surveilans Faskes (FRI)', icon: Building2 },
        { id: 'dpjp', label: 'Intelijen Beban DPJP', icon: UserCheck },
        { id: 'mobile_bridge', label: 'Telemetri Mobile JKN', icon: Radio },
      ],
    },
    {
      group: 'Operasi AI & Agen',
      items: [
        { id: 'health_ai_chat', label: 'Asisten Audit JKN (AI)', icon: Sparkles, badge: 'HealthAI', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { id: 'agent_copilot', label: 'AI Agent Forensik ReAct', icon: Bot, badge: 'AI', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { id: 'command_center', label: 'Pusat Komando (CRM)', icon: Users },
        { id: 'conversations', label: 'Dialog AI Forensik', icon: MessageSquare },
        { id: 'interventions', label: 'Rencana Intervensi (TCA)', icon: ClipboardList, badge: 'TCA', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
      ],
    },
    {
      group: 'Tata Kelola & Basis Data',
      items: [
        { id: 'decision', label: 'Konsol Eksekusi & BAKB', icon: ShieldAlert },
        { id: 'audit', label: 'Ledger Audit SHA-256', icon: Key },
        { id: 'database_viewer', label: 'Penampil Basis Data (SQL)', icon: Database },
      ],
    },
  ];

  const sidebarNavItems = sidebarNavGroups.flatMap((g) => g.items);

  // User Profile & Roles (Standar Kepegawaian BPJS Kesehatan)
  const getInitialUser = () => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('claimtrace_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.name || parsed.nip)) {
            return {
              name: parsed.name || 'Budi Santoso, S.Kom, M.TI',
              email: parsed.email || 'admin.fraud@bpjs-kesehatan.go.id',
              nip: parsed.nip || '199208152015031002',
              role: parsed.role || parsed.roleTitle || 'Analis Forensik Digital Anti-Fraud',
              roleTitle: parsed.roleTitle || 'Auditor Investigasi Klaim',
              unit: parsed.unit || 'Kedeputian Bidang Pengawasan dan Pemeriksaan',
              avatar: parsed.avatar || (parsed.name ? parsed.name.slice(0, 2).toUpperCase() : 'BS'),
              isMfaVerified: parsed.isMfaVerified ?? true,
              allowedRoles: parsed.allowedRoles || ['FRAUD_INVESTIGATOR', 'ANALYST', 'SUPER_ADMIN']
            };
          }
        }
      } catch {}
    }
    return {
      name: 'Administrator Khalaf Dev',
      email: 'verifikator.khalaf@bpjs-kesehatan.go.id',
      nip: '198704202011012001',
      role: 'Verifikator Utama Klaim FKRTL',
      unit: 'Kantor Cabang Surakarta · Kedeputian Wilayah VI',
      avatar: 'AD',
      isMfaVerified: true
    };
  };

  const [currentUser, setCurrentUser] = useState(getInitialUser);

  useEffect(() => {
    if (typeof window !== 'undefined' && currentUser) {
      try {
        localStorage.setItem('claimtrace_user', JSON.stringify(currentUser));
      } catch {}
    }
  }, [currentUser]);

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
  const [headerAlerts, setHeaderAlerts] = useState([
    {
      id: 'ALT-01',
      severity: 'critical',
      type: 'KLASTER FIKTIF (PHANTOM)',
      title: 'Klaster 85 Pasien Fisioterapi (CLM-2026-10-085)',
      message: 'RS Khusus Mitra Husada · SIP DPJP kedaluwarsa & sangkalan presensi Mobile JKN.',
      time: '2 mnt lalu',
      is_seen: false,
      targetTab: 'investigation'
    },
    {
      id: 'ALT-02',
      severity: 'high',
      type: 'PERINGATAN JATUH TEMPO SLA',
      title: 'Batas Waktu SLA 10 Hari Kerja (Sisa 7 Hari)',
      message: '3 klaim prioritas tinggi memerlukan verifikasi sebelum jatuh tempo BAKB.',
      time: '14 mnt lalu',
      is_seen: false,
      targetTab: 'decision'
    },
    {
      id: 'ALT-03',
      severity: 'info',
      type: 'LAPORAN IA TERSEDIA',
      title: 'Laporan Mingguan Analitik Wawasan (IA) Diterbitkan',
      message: 'Analisis pola anomali mingguan & rekomendasi intervensi siap ditinjau.',
      time: '1 jam lalu',
      is_seen: false,
      targetTab: 'executive'
    }
  ]);

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

  // Jam Resmi Server BPJS Kesehatan (Waktu Indonesia Barat - WIB)
  const [currentServerTime, setCurrentServerTime] = useState(() => {
    return new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).replace(/\./g, ':') + ' WIB';
  });

  // Mode Tema Dasbor (dark / light / system)
  const [theme, setTheme] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const urlTheme = params.get('theme');
        if (urlTheme === 'light' || urlTheme === 'dark' || urlTheme === 'system') {
          return urlTheme;
        }
        return localStorage.getItem('claimtrace_theme') || 'dark';
      }
    } catch {
      return 'dark';
    }
    return 'dark';
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

  const effectiveTheme = theme === 'system' ? (systemPrefersLight ? 'light' : 'dark') : theme;
  const isLight = effectiveTheme === 'light';

  useEffect(() => {
    try {
      localStorage.setItem('claimtrace_theme', theme);
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
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
      setCurrentServerTime(
        new Date().toLocaleTimeString('id-ID', {
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

  // Trigger simulasi pengiriman notifikasi dari verifikator
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

  // Tangani respons peserta
  const handlePatientAnswer = (answer) => {
    setPatientResponse(answer);
    setShowModal(false);
    setNotificationToast(false);
    
    if (answer === 'denied') {
      setLapis3Score(92);
      setToastMessage('Laporan dicatat: Peserta menyangkal kehadiran. Skor anomali Lapis 3 naik ke 92 (Indikasi Phantom Billing).');
    } else {
      setLapis3Score(30);
      setToastMessage('Laporan dicatat: Peserta mengonfirmasi kehadiran sah.');
    }
  };

  const resetDemo = () => {
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

  // Handler pergantian peran cepat untuk pengujian kedinasan
  const switchRole = (roleName, userName, nip, unit) => {
    setCurrentUser({
      name: userName,
      nip: nip,
      role: roleName,
      unit: unit,
      avatar: getInitials(userName),
      isMfaVerified: true
    });
  };

  // -------------------------------------------------------------
  // RENDER APP WITH MOTION ANIMATED PRESENCE
  // -------------------------------------------------------------
  return (
    <>
      <AnimatePresence mode="wait">
      {authView === 'landing' && (
        <motion.div 
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#000c24] text-white'} min-h-screen font-inter transition-colors duration-200`}
        >
          <LandingPage 
            isLight={isLight}
            onToggleTheme={() => setTheme((curr) => (curr === 'light' ? 'dark' : 'light'))}
            onEnterCockpit={() => setAuthView('login')}
            onExplore={() => setAuthView('dashboard')}
            onGoToLogin={() => setAuthView('login')}
            onGoToDemo={() => setAuthView('dashboard')}
            onChangeView={(v) => setAuthView(v)}
            onOpenLegal={openLegalModal}
          />
        </motion.div>
      )}

      {(authView === 'login' || authView === 'mfa') && (
        <motion.div 
          key="login"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={`${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#000c24] text-white'} fixed inset-0 h-[100dvh] max-h-screen flex flex-col font-inter overflow-hidden select-none z-40 transition-colors duration-200`}
        >
          {/* Top Header Navbar */}
          <header className={`shrink-0 ${isLight ? 'bg-white/90 border-slate-200 text-slate-900 shadow-sm' : 'bg-[#000c24]/90 border-white/10 text-white shadow-xl'} backdrop-blur-xl border-b py-3 px-4 sm:px-6 lg:px-8 z-30 transition-colors duration-200`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              
              {/* Left Section: Logo & Nav */}
              <div className="flex items-center gap-8">
                {/* Logo with Circular Container */}
                <div 
                  onClick={() => setAuthView('landing')}
                  className="flex items-center gap-3 group cursor-pointer"
                >
                  <div className={`relative w-9 h-9 overflow-hidden rounded-full border ${isLight ? 'border-slate-200 bg-slate-100 group-hover:border-emerald-500' : 'border-white/20 bg-white/10 group-hover:border-[#FFCA40]'} transition-colors duration-300 shadow-lg backdrop-blur-sm p-1 flex items-center justify-center shrink-0`}>
                    <img 
                      alt="BPJS Kesehatan" 
                      className="object-contain w-full h-full" 
                      src="/assets/images/bpjs_icon.png"
                    />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-base font-bold leading-none ${isLight ? 'text-slate-900 group-hover:text-emerald-700' : 'text-white group-hover:text-[#FFCA40]'} tracking-tight transition-colors`}>
                        ClaimTrace
                      </span>
                      <span className={`text-[9px] font-bold ${isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-[#FFCA40]/20 text-[#FFCA40] border-[#FFCA40]/30'} px-1.5 py-0.5 rounded border`}>
                        DSS
                      </span>
                    </div>
                    <span className={`text-[9px] uppercase tracking-widest ${isLight ? 'text-emerald-700' : 'text-[#FFCA40]/80'} font-bold mt-1`}>
                      Penapisan Risiko Klaim
                    </span>
                  </div>
                </div>

                {/* Desktop Nav Links (Only Regulasi & PDP as requested by user) */}
                <nav className="hidden md:flex items-center gap-7">
                  <button
                    onClick={() => openLegalModal('privacy')}
                    className={`text-sm font-semibold ${isLight ? 'text-emerald-700 hover:text-emerald-800' : 'text-emerald-400 hover:text-emerald-300'} transition-colors py-1 relative group flex items-center space-x-1 cursor-pointer`}
                  >
                    <Shield className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                    <span>Regulasi &amp; PDP</span>
                  </button>
                </nav>
              </div>

              {/* Right Section: Theme Toggle & Back to Landing Pill Button */}
              <div className="flex items-center gap-2.5">
                {/* Quick Theme Toggle Button */}
                <button
                  type="button"
                  onClick={() => setTheme((curr) => (curr === 'light' ? 'dark' : 'light'))}
                  title={isLight ? 'Beralih ke Tema Gelap (Cosmic Obsidian)' : 'Beralih ke Tema Terang (Clinical White)'}
                  className={`p-2 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                    isLight
                      ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900 shadow-2xs'
                      : 'bg-white/10 border-white/15 text-white/80 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  {isLight ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-[#FFCA40]" />}
                </button>

                <button
                  onClick={() => setAuthView('landing')}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
                    isLight
                      ? 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200'
                      : 'text-white/80 hover:text-white bg-white/10 hover:bg-white/15 border-white/15 hover:border-[#FFCA40]/40'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Beranda</span>
                </button>
              </div>

            </div>
          </header>
          <SignInPage 
            initialOpenModal={authView === 'mfa'}
            isLight={isLight}
            onLoginSuccess={(user) => {
              if (user) setCurrentUser(user);
              setAuthView('dashboard');
            }}
          />

          {/* Official Institutional Footer BPJS Kesehatan */}
          <footer className={`shrink-0 ${
            isLight
              ? 'bg-slate-100/95 border-slate-200 text-slate-600'
              : 'bg-[#00081c]/95 border-white/10 text-white/60'
          } backdrop-blur-md border-t py-2 px-4 sm:px-8 text-xs z-20 transition-colors duration-200`}>
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white/90'}`}>
                  © 2026 BPJS Kesehatan · ClaimTrace DSS
                </span>
                <span className={isLight ? 'text-slate-400' : 'text-white/30'}>•</span>
                <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Hak Cipta Dilindungi</span>
              </div>
              <p className={`text-[10px] sm:text-[10.5px] italic text-center ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                Standar: UU PDP No. 27/2022 · Perpres No. 82/2018 · ISO/IEC 27001:2022
              </p>
              <div className={`flex items-center gap-2.5 text-xs font-medium ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                <button onClick={() => openLegalModal('privacy')} className={`transition cursor-pointer font-semibold ${isLight ? 'hover:text-emerald-700' : 'hover:text-[#FFCA40]'}`}>
                  Privacy
                </button>
                <span className={isLight ? 'text-slate-400' : 'text-white/30'}>•</span>
                <button onClick={() => openLegalModal('terms')} className={`transition cursor-pointer font-semibold ${isLight ? 'hover:text-emerald-700' : 'hover:text-[#FFCA40]'}`}>
                  Terms
                </button>
                <span className={isLight ? 'text-slate-400' : 'text-white/30'}>•</span>
                <button onClick={() => openLegalModal('security')} className={`transition cursor-pointer ${isLight ? 'hover:text-emerald-700' : 'hover:text-[#FFCA40]'}`}>
                  Keamanan
                </button>
                <span className={isLight ? 'text-slate-400' : 'text-white/30'}>•</span>
                <button onClick={() => openLegalModal('sla')} className={`transition cursor-pointer ${isLight ? 'hover:text-emerald-700' : 'hover:text-[#FFCA40]'}`}>
                  SLA 10 Hari
                </button>
              </div>
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
          <SignOutPage 
            onLoginAgain={() => setAuthView('login')}
            user={currentUser}
          />
        </motion.div>
      )}

      {authView === 'dashboard' && (
        <motion.div 
          key="dashboard"
          id="cockpit-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`h-screen max-h-screen flex flex-col font-inter antialiased overflow-hidden selection:bg-emerald-500 selection:text-white transition-colors duration-300 ${
            isLight
              ? 'bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 text-slate-900 theme-light'
              : 'dark bg-gradient-to-b from-[#000c24] via-[#00153A] to-[#001D58] text-white theme-dark'
          }`}
        >
          {/* ======================================================== */}
          {/* UNIFIED ADMIN HEADER (FUTURISTIC COCKPIT)   */}
          {/* ======================================================== */}
          <header className={`backdrop-blur-xl border-b px-4 py-2.5 shrink-0 z-40 transition-colors duration-200 ${
            isLight
              ? 'bg-white/95 border-slate-200 text-slate-800 shadow-xs'
              : 'bg-[#000c24]/90 border-white/10 text-white shadow-xl'
          }`}>
            <div className="w-full flex items-center justify-between gap-3">
              
              {/* Left: Sidebar Toggle, Brand Logo & Quick Search */}
              <div className="flex items-center space-x-3 shrink-0">
                <button 
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className={`p-2 rounded-xl transition cursor-pointer border flex items-center justify-center ${
                    isLight ? 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200' : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                  }`}
                  title={sidebarCollapsed ? "Buka Menu Modul" : "Ciutkan Menu Modul"}
                >
                  {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                </button>

                <div 
                  onClick={() => setAuthView('landing')}
                  className="flex items-center space-x-2.5 cursor-pointer group"
                  title="Kembali ke Beranda Publik"
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
                      <span className={`font-bold tracking-tight text-sm transition-colors ${
                        isLight ? 'text-slate-900 group-hover:text-emerald-700' : 'text-white group-hover:text-[#FFCA40]'
                      }`}>ClaimTrace</span>
                      <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded border ${
                        isLight 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                          : 'bg-[#FFCA40]/15 text-[#FFCA40] border-[#FFCA40]/30'
                      }`}>
                        DSS JKN
                      </span>
                    </div>
                    <p className={`text-[10px] hidden lg:block whitespace-nowrap ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                      Pengawasan Pra-Pembayaran Klaim JKN · KC Surakarta
                    </p>
                  </div>
                </div>

                {/* Quick Search Bar (Glass Input) */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (headerSearch.trim()) {
                      setDashboardTab('queue');
                      setHeaderSearch('');
                    }
                  }}
                  className={`hidden xl:flex items-center border rounded-xl px-3 py-1.5 w-72 xl:w-80 relative ml-2 transition-colors ${
                    isLight ? 'bg-slate-100/90 border-slate-300 text-slate-900' : 'bg-white/10 border-white/10 text-white'
                  }`}
                >
                  <Search className={`w-3.5 h-3.5 mr-2 shrink-0 ${isLight ? 'text-slate-500' : 'text-white/40'}`} />
                  <input
                    type="text"
                    placeholder="Cari modul / no. SEP..."
                    value={headerSearch}
                    onChange={(e) => setHeaderSearch(e.target.value)}
                    className={`bg-transparent border-none outline-none text-xs w-full pr-14 pl-1 focus:ring-0 ${
                      isLight ? 'text-slate-900 placeholder-slate-400' : 'text-white placeholder-white/40'
                    }`}
                  />
                  <button
                    type="submit"
                    className={`absolute right-1 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1 text-[10.5px] font-bold border transition-colors cursor-pointer keep-white ${
                      isLight 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-xs' 
                        : 'bg-[#FFCA40]/20 text-[#FFCA40] hover:bg-[#FFCA40]/30 border-[#FFCA40]/30'
                    }`}
                  >
                    Cari
                  </button>
                </form>
              </div>

              {/* Center: VIEW MODE CONTROLLER (LAYAR PENUH vs DUAL VIEW vs MOBILE JKN) */}
              <div className={`flex items-center p-1 rounded-xl border text-xs font-semibold shrink-0 transition-colors ${
                isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-white/70'
              }`}>
                <button
                  onClick={() => setViewMode('dashboard')}
                  aria-label="Beralih ke tampilan Cockpit layar penuh"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === 'dashboard' 
                      ? (isLight ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-300' : 'bg-white/15 text-white font-bold shadow-sm border border-white/20') 
                      : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white')
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Layar Penuh</span>
                </button>
                <button
                  onClick={() => setViewMode(viewMode === 'split' ? 'dashboard' : 'split')}
                  aria-label="Beralih ke tampilan Dual View Mobile JKN dan Cockpit"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === 'split' 
                      ? (isLight ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-300' : 'bg-white/15 text-white font-bold shadow-sm border border-white/20') 
                      : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white')
                  }`}
                  title={viewMode === 'split' ? "Tutup telemetri & kembali ke Layar Penuh" : "Buka telemetri Mobile JKN berdampingan dengan cockpit"}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Dual View (Mobile &amp; Cockpit)</span>
                </button>
                <button
                  onClick={() => setViewMode(viewMode === 'mobile' ? 'dashboard' : 'mobile')}
                  aria-label="Beralih ke aplikasi Mobile JKN peserta"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === 'mobile' 
                      ? (isLight ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-300' : 'bg-white/15 text-white font-bold shadow-sm border border-white/20') 
                      : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white')
                  }`}
                  title={viewMode === 'mobile' ? "Kembali ke Dashboard Cockpit" : "Buka aplikasi Mobile JKN peserta"}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Mobile JKN Peserta</span>
                </button>
              </div>

              {/* Right: Session Timer, Theme Quick Toggle, Notification Bell Popover & User Profile Dropdown */}
              <div className="flex items-center space-x-2.5 md:space-x-3 shrink-0">
                {/* 6 Standar Siber & Anti-Fraud Pill (MITRE F3 · ATT&CK · NIST CSF 2.0) */}
                <button
                  type="button"
                  onClick={() => openLegalModal('frameworks')}
                  className={`hidden xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-[10.5px] font-mono shadow-xs transition cursor-pointer ${
                    isLight 
                      ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800' 
                      : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300 shadow-emerald-500/10'
                  }`}
                  title="Lihat Kepatuhan 6 Kerangka Kerja Siber & Anti-Fraud (MITRE F3, ATT&CK, NIST CSF, ATLAS, D3FEND, AI RMF)"
                  aria-label="Buka Kerangka Kerja Siber & Anti-Fraud MITRE F3, ATT&CK, NIST"
                >
                  <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                  <span className="font-bold">MITRE F3 · ATT&amp;CK · NIST CSF</span>
                </button>

                {/* Jam Resmi Server BPJS Kesehatan (WIB) */}
                <div 
                  className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono tabular-nums shadow-2xs select-none ${
                    isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-white/80'
                  }`}
                  title="Waktu Resmi Server BPJS Kesehatan KC Surakarta (WIB)"
                >
                  <Clock className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                  <span className="font-semibold tracking-tight">{currentServerTime}</span>
                </div>

                {/* Quick Theme Toggle Button (Light / Dark) */}
                <button
                  type="button"
                  onClick={() => {
                    const nextTheme = effectiveTheme === 'light' ? 'dark' : 'light';
                    setTheme(nextTheme);
                    setToastMessage(nextTheme === 'light' ? 'Tema Terang (Clinical White) Aktif' : 'Tema Gelap (Cosmic Obsidian) Aktif');
                  }}
                  className={`p-2 rounded-xl transition cursor-pointer flex items-center justify-center border ${
                    isLight 
                      ? 'border-slate-200 bg-slate-100 text-amber-600 hover:bg-slate-200' 
                      : 'border-white/10 bg-white/5 text-[#FFCA40] hover:bg-white/10'
                  }`}
                  title={effectiveTheme === 'light' ? "Beralih ke Tema Gelap (Cosmic Obsidian)" : "Beralih ke Tema Terang (Clinical White)"}
                  aria-label="Ganti Mode Tema Dasbor"
                >
                  {isLight ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-[#FFCA40]" />}
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
                        initial={{ opacity: 0, scale: 0.95, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 6 }}
                        transition={{ duration: 0.14 }}
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
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
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
                              isLight ? 'text-emerald-700 hover:text-emerald-800' : 'text-[#FFCA40] hover:text-[#FFE08C]'
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
                      isLight ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300' : 'bg-[#FFCA40]/20 text-[#FFCA40] ring-1 ring-[#FFCA40]/50'
                    }`}>
                      <span className="font-bold tracking-tight">
                        {currentUser.avatar && currentUser.avatar !== 'dS' ? currentUser.avatar : getInitials(currentUser.name)}
                      </span>
                    </div>
                    <span className={`hidden md:inline-block ml-2 text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white/90'}`}>
                      {currentUser.name || 'Administrator Khalaf Dev'}
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
                        initial={{ opacity: 0, scale: 0.95, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 6 }}
                        transition={{ duration: 0.14 }}
                        className={`absolute right-0 mt-2.5 w-64 origin-top-right border rounded-2xl shadow-2xl focus:outline-none py-1.5 z-50 backdrop-blur-xl ${
                          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#00153A] border-white/10 text-white'
                        }`}
                      >
                        <div className={`px-4 py-3 border-b ${isLight ? 'border-slate-200 bg-slate-50/70' : 'border-white/10 bg-[#001030]'}`}>
                          <p className={`text-sm font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {currentUser.name || 'Administrator Khalaf Dev'}
                          </p>
                          <p className={`text-xs truncate mt-0.5 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                            {currentUser.email || 'verifikator.khalaf@bpjs-kesehatan.go.id'}
                          </p>
                          <div className="mt-2 flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                              isLight 
                                ? 'bg-slate-100 text-slate-700 border-slate-200' 
                                : 'bg-white/10 text-white/80 border-white/15'
                            }`}>
                              Verifikator Medis Utama
                            </span>
                            <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                              NIP 19880312
                            </span>
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
                            <span>Pengaturan Sistem</span>
                          </button>

                          <div className={`my-1 border-t ${isLight ? 'border-slate-100' : 'border-white/10'}`} />

                          <button
                            type="button"
                            onClick={() => {
                              setProfileMenuOpen(false);
                              setAuthView('logout');
                            }}
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
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            transition={{ duration: 0.2 }}
            className={`fixed top-20 left-1/2 z-50 text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 backdrop-blur-xl border overflow-hidden ${
              isLight 
                ? 'bg-white text-slate-900 border-emerald-500/40 shadow-slate-300/50' 
                : 'bg-[#00153A] text-white border-emerald-500/50 shadow-black/80'
            }`}
          >
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
            <button 
              onClick={() => setToastMessage('')} 
              aria-label="Tutup notifikasi"
              className={`ml-2 cursor-pointer p-0.5 rounded transition ${isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
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
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* COLLAPSIBLE SIDEBAR */}
        <motion.aside 
          animate={{ width: sidebarCollapsed ? 68 : 268 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className={`border-r flex flex-col justify-between shrink-0 overflow-hidden h-full z-10 transition-colors duration-200 ${
            isLight
              ? 'bg-white border-slate-200 text-slate-800 shadow-md'
              : 'bg-[#000c24] border-white/10 text-white shadow-2xl'
          }`}
        >
          {/* Navigation Links Grouped & Organized */}
          <div className="p-2.5 overflow-y-auto flex-1 min-h-0 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
            {sidebarNavGroups.map((group, gIdx) => (
              <div key={group.group} className="space-y-0.5">
                {!sidebarCollapsed ? (
                  <div className={`px-2 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-widest flex items-center justify-between select-none ${
                    isLight ? 'text-slate-400' : 'text-white/40'
                  }`}>
                    <span>{group.group}</span>
                    <span className={`text-[9px] font-mono font-normal ${isLight ? 'text-slate-400' : 'text-white/30'}`}>{group.items.length}</span>
                  </div>
                ) : (
                  gIdx > 0 && <div className={`my-1 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`} />
                )}

                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = dashboardTab === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setDashboardTab(item.id);
                        if (mainContentRef.current) {
                          mainContentRef.current.scrollTop = 0;
                          mainContentRef.current.scrollLeft = 0;
                        }
                      }}
                      title={item.label}
                      className={`w-full flex items-center ${
                        sidebarCollapsed ? 'justify-center px-0 py-2' : 'justify-between px-2.5 py-1.5'
                      } rounded-xl text-xs transition cursor-pointer ${
                        isActive
                          ? (isLight
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold shadow-xs'
                              : 'bg-gradient-to-r from-emerald-500/25 to-teal-500/15 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10 font-semibold')
                          : (isLight
                              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                              : 'text-white/70 hover:text-white hover:bg-white/5 font-normal')
                      }`}
                    >
                      <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2 min-w-0'}`}>
                        <Icon className={`${sidebarCollapsed ? 'w-4 h-4' : 'w-3.5 h-3.5'} shrink-0 ${
                          isActive 
                            ? (isLight ? 'text-emerald-700' : 'text-emerald-400')
                            : (isLight ? 'text-slate-500' : 'text-white/50')
                        }`} />
                        {!sidebarCollapsed && (
                          <span className="truncate text-left text-[11.5px]">{item.label}</span>
                        )}
                      </div>
                      {!sidebarCollapsed && item.badge && (
                        <span
                          className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded font-bold shrink-0 ml-1.5 border leading-tight ${
                            isActive
                              ? (isLight ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-emerald-500/30 text-emerald-200 border-emerald-400/50')
                              : (isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-white/10 text-white/70 border-white/10')
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            ))}
          </div>
        </motion.aside>

        {/* WORKSPACE AREA */}
        <main ref={mainContentRef} className={`flex-1 overflow-y-auto p-3 lg:p-4 backdrop-blur-xs min-h-0 transition-colors duration-200 ${
          isLight ? 'bg-slate-100/70 text-slate-900' : 'bg-[#001030]/40 text-white'
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
                <div className="w-full max-w-[365px] flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className={`text-[11px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${
                      isLight 
                        ? 'bg-amber-100 text-amber-800 border-amber-300' 
                        : 'bg-[#FFCA40]/20 text-[#FFCA40] border-[#FFCA40]/30'
                    }`}>
                      Aplikasi Mobile JKN
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={resetDemo}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md transition-all cursor-pointer border ${
                        isLight 
                          ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100' 
                          : 'border-white/15 bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                      }`}
                      title="Reset status konfirmasi presensi peserta"
                    >
                      <RotateCcw className={`w-3 h-3 ${isLight ? 'text-amber-600' : 'text-[#FFCA40]'}`} />
                      <span>Reset</span>
                    </button>

                    <button
                      onClick={closeSimulator}
                      className="text-[11px] font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-300 hover:border-rose-600 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md transition-all cursor-pointer group"
                      title="Tutup layar Mobile JKN dan kembalikan ke Layar Penuh"
                    >
                      <X className="w-3.5 h-3.5 text-rose-500 group-hover:text-white transition-colors" />
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
                                Mohon konfirmasi apakah Anda benar menerima tindakan Fisioterapi di RS Khusus Mitra Husada.
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
                      {/* HOME */}
                      {currentScreen === 'home' && (
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5">
                          <div className="flex items-center justify-between pt-1">
                            <div>
                              <h2 className="text-base font-bold text-slate-900 leading-tight">
                                Hi, KHALAF
                              </h2>
                              <p className="text-[11px] text-slate-500 font-medium">
                                Akun Anda belum terverifikasi.
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
                                onClick={() => navigateTo('antrean')}
                                className="mt-2 bg-[#0288D1] hover:bg-[#0277bd] text-white text-[11px] font-bold px-4 py-1.5 rounded-full shadow-sm active:scale-95 transition"
                              >
                                Ambil Antrean
                              </button>
                            </div>
                          </div>

                          {/* 12 Grid Menus */}
                          <div className="grid grid-cols-4 gap-y-3 gap-x-2 bg-white rounded-2xl p-3 shadow-sm border border-slate-200">
                            <div onClick={() => navigateTo('more_menu')} className="flex flex-col items-center text-center group cursor-pointer">
                              <img src="/assets/images/icon_program_jkn.png" alt="Info Program JKN" className="w-12 h-12 object-contain" />
                              <span className="text-[9.5px] font-medium text-slate-700 leading-tight mt-1 line-clamp-2">Info Program JKN</span>
                            </div>
                            <div onClick={() => navigateTo('chat_dokter')} className="flex flex-col items-center text-center group cursor-pointer">
                              <img src="/assets/images/icon_telehealth.png" alt="Telehealth" className="w-12 h-12 object-contain" />
                              <span className="text-[9.5px] font-medium text-slate-700 leading-tight mt-1 line-clamp-2">TELEHEALTH</span>
                            </div>
                            <div onClick={() => navigateTo('riwayat')} className="flex flex-col items-center text-center group cursor-pointer">
                              <img src="/assets/images/icon_icare.png" alt="Info Riwayat" className="w-12 h-12 object-contain" />
                              <span className="text-[9.5px] font-medium text-slate-700 leading-tight mt-1 line-clamp-2">Riwayat Pelayanan</span>
                            </div>
                            <div onClick={() => navigateTo('bugar')} className="flex flex-col items-center text-center group cursor-pointer">
                              <img src="/assets/images/icon_bugar.png" alt="Bugar" className="w-12 h-12 object-contain" />
                              <span className="text-[9.5px] font-medium text-slate-700 leading-tight mt-1 line-clamp-2">Bugar</span>
                            </div>
                            <div onClick={() => navigateTo('pembayaran')} className="flex flex-col items-center text-center group cursor-pointer">
                              <img src="/assets/images/icon_rehab.png" alt="NEW Rehab" className="w-12 h-12 object-contain" />
                              <span className="text-[9.5px] font-medium text-slate-700 leading-tight mt-1 line-clamp-2">NEW Rehab</span>
                            </div>
                            <div onClick={() => navigateTo('ubah_data')} className="flex flex-col items-center text-center group cursor-pointer">
                              <img src="/assets/images/icon_penambahan_peserta.png" alt="Penambahan" className="w-12 h-12 object-contain" />
                              <span className="text-[9.5px] font-medium text-slate-700 leading-tight mt-1 line-clamp-2">Penambahan</span>
                            </div>
                            <div onClick={() => navigateTo('kartu')} className="flex flex-col items-center text-center group cursor-pointer">
                              <img src="/assets/images/icon_info_peserta.png" alt="Info Peserta" className="w-12 h-12 object-contain" />
                              <span className="text-[9.5px] font-medium text-slate-700 leading-tight mt-1 line-clamp-2">Info Peserta</span>
                            </div>
                            <div onClick={() => setToastMessage('Panggilan Darurat BPJS Care Center 165 terhubung (Bebas Pulsa 24 Jam).')} className="flex flex-col items-center text-center group cursor-pointer">
                              <img src="/assets/images/icon_sos.png" alt="SOS" className="w-12 h-12 object-contain" />
                              <span className="text-[9.5px] font-medium text-slate-700 leading-tight mt-1 line-clamp-2">SOS 165</span>
                            </div>
                            <div onClick={() => navigateTo('tempat_tidur')} className="flex flex-col items-center text-center group cursor-pointer">
                              <img src="/assets/images/icon_lokasi_faskes.png" alt="Lokasi Faskes" className="w-12 h-12 object-contain" />
                              <span className="text-[9.5px] font-medium text-slate-700 leading-tight mt-1 line-clamp-2">Info Faskes</span>
                            </div>
                            <div onClick={() => navigateTo('ubah_data')} className="flex flex-col items-center text-center group cursor-pointer">
                              <img src="/assets/images/icon_perubahan_data.png" alt="Ubah Data" className="w-12 h-12 object-contain" />
                              <span className="text-[9.5px] font-medium text-slate-700 leading-tight mt-1 line-clamp-2">Ubah Data</span>
                            </div>
                            <div onClick={() => navigateTo('pengaduan')} className="flex flex-col items-center text-center group cursor-pointer">
                              <img src="/assets/images/icon_pengaduan.png" alt="Pengaduan" className="w-12 h-12 object-contain" />
                              <span className="text-[9.5px] font-medium text-slate-700 leading-tight mt-1 line-clamp-2">Pengaduan</span>
                            </div>
                            <div onClick={() => navigateTo('more_menu')} className="flex flex-col items-center text-center group cursor-pointer">
                              <img src="/assets/images/icon_menu_lainnya.png" alt="Lainnya" className="w-12 h-12 object-contain" />
                              <span className="text-[9.5px] font-medium text-slate-700 leading-tight mt-1 line-clamp-2">Menu Lainnya</span>
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
                            <button onClick={() => navigateTo('home')} className="p-1 text-slate-600 hover:text-black">
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <h2 className="text-sm font-bold text-slate-900">Kartu Peserta KIS Digital</h2>
                          </div>
                          <div className="relative w-full rounded-2xl overflow-hidden shadow-md border border-emerald-600/30">
                            <img src="/assets/images/kartu_kis_full.png" alt="Kartu KIS" className="w-full h-auto object-cover" />
                            <div className="absolute inset-0 p-5 flex flex-col justify-between text-slate-900 select-none">
                              <span className="text-[10px] font-bold text-emerald-800 tracking-wider">INDONESIA SEHAT</span>
                              <div className="space-y-1 my-auto pt-4">
                                <p className="text-[10px] text-slate-600 font-medium uppercase">Nama Peserta</p>
                                <p className="text-sm font-bold text-slate-950 tracking-wide">KHALAF FAITH PRADYATAMA</p>
                                <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
                                  <div>
                                    <span className="text-slate-500">Nomor Kartu:</span>
                                    <p className="font-bold font-mono text-slate-900">0002891728192</p>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">NIK:</span>
                                    <p className="font-bold font-mono text-slate-900">3372052109080001</p>
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
                            <button onClick={() => navigateTo('home')} className="p-1 text-slate-600 hover:text-black">
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
                            <p>Nama: KHALAF FAITH PRADYATAMA</p>
                            <p>No. KIS: 0002891728192</p>
                            <p>Kantor Cabang: KC Surakarta</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* BOTTOM NAV BAR */}
                    <div className="relative bg-white border-t border-slate-200 px-3 py-2 flex items-center justify-between select-none z-20 shrink-0">
                      <button onClick={() => navigateTo('home')} className={`flex flex-col items-center w-12 ${activeTab === 'home' && currentScreen === 'home' ? 'text-[#0288D1]' : 'text-slate-400'}`}>
                        <Home className="w-5 h-5" />
                        <span className="text-[10px] font-bold mt-0.5">Home</span>
                      </button>
                      <button onClick={() => navigateTo('berita')} className={`flex flex-col items-center w-12 ${activeTab === 'berita' || currentScreen === 'berita' ? 'text-[#0288D1]' : 'text-slate-400'}`}>
                        <FileText className="w-5 h-5" />
                        <span className="text-[10px] font-medium mt-0.5">Berita</span>
                      </button>
                      <div className="relative -top-5 flex flex-col items-center">
                        <button onClick={() => navigateTo('kartu')} className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#0288D1] to-[#00A65A] text-white flex items-center justify-center shadow-md border-4 border-white active:scale-95 transition">
                          <CreditCard className="w-6 h-6" />
                        </button>
                        <span className="text-[10px] font-bold mt-0.5 text-slate-600">Kartu</span>
                      </div>
                      <button onClick={() => navigateTo('faq')} className={`flex flex-col items-center w-12 ${activeTab === 'faq' || currentScreen === 'faq' ? 'text-[#0288D1]' : 'text-slate-400'}`}>
                        <HelpCircle className="w-5 h-5" />
                        <span className="text-[10px] font-medium mt-0.5">FAQ</span>
                      </button>
                      <button onClick={() => navigateTo('profil')} className={`flex flex-col items-center w-12 ${activeTab === 'profil' || currentScreen === 'profil' ? 'text-[#0288D1]' : 'text-slate-400'}`}>
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
                              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
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
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm transition"
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

                {/* FOOTER ACTION TO RETURN TO FULL COCKPIT */}
                <button
                  onClick={closeSimulator}
                  className="mt-2 text-xs font-bold text-white/80 hover:text-rose-300 bg-white/10 hover:bg-rose-500/20 border border-white/15 hover:border-rose-500/40 flex items-center gap-1.5 py-1.5 px-3.5 rounded-full shadow-lg transition cursor-pointer backdrop-blur-md"
                  title="Tutup layar Mobile JKN dan kembalikan cockpit ke layar penuh"
                >
                  <EyeOff className="w-3.5 h-3.5 text-white/60 hover:text-rose-300" />
                  <span>Tutup Layar Mobile JKN &bull; Kembali ke Cockpit Penuh</span>
                </button>
              </div>
            )}

            {/* ======================================================== */}
            {/* SISI KANAN: DASHBOARD VERIFIKATOR BPJS (10 MODUL)        */}
            {/* ======================================================== */}
            {(viewMode === 'split' || viewMode === 'dashboard') && (
              <div className={`flex flex-col space-y-4 ${
                viewMode === 'split' ? 'flex-1 min-w-0' : 'w-full'
              }`}>
                
                {/* ACTIVE MODULE VIEW RENDERER WITH MOTION TRANSITION */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={dashboardTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="w-full space-y-4"
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

                    {dashboardTab === 'insights' && (
                      <InsightsAnalyticsView
                        isLight={isLight}
                        onNavigateTab={(t) => setDashboardTab(t)}
                      />
                    )}

                    {dashboardTab === 'retention' && (
                      <RetentionAnalyticsView
                        isLight={isLight}
                        onNavigateTab={(t) => setDashboardTab(t)}
                      />
                    )}

                    {dashboardTab === 'cases_mgmt' && (
                      <CasesManagementView
                        isLight={isLight}
                        onNavigateTab={(t) => setDashboardTab(t)}
                        onSelectCase={(cId) => {
                          setSelectedCase({ id: cId });
                          setDashboardTab('investigation');
                        }}
                      />
                    )}

                    {dashboardTab === 'quick_triage' && (
                      <QuickTriageView
                        isLight={isLight}
                        onNavigateTab={(t) => setDashboardTab(t)}
                        onSelectCase={(cId) => {
                          setSelectedCase({ id: cId });
                          setDashboardTab('investigation');
                        }}
                      />
                    )}

                    {dashboardTab === 'flagged_sessions' && (
                      <FlaggedSessionsView
                        onNavigateTab={(t) => setDashboardTab(t)}
                        onSelectCase={(cId) => {
                          setSelectedCase({ id: cId });
                          setDashboardTab('investigation');
                        }}
                        isLight={isLight}
                      />
                    )}

                    {dashboardTab === 'appointments' && (
                      <ClarificationScheduleView
                        isLight={isLight}
                        onNavigateTab={(t) => setDashboardTab(t)}
                        onSelectCase={(cId) => {
                          setSelectedCase({ id: cId });
                          setDashboardTab('investigation');
                        }}
                      />
                    )}

                    {dashboardTab === 'command_center' && (
                      <CommandCenterView
                        onSelectCase={(cId) => {
                          setSelectedCase(typeof cId === 'object' && cId !== null ? cId : {
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
                            flags: ['BAKSOS MASSAL', 'SIP MUTASI']
                          });
                          setDashboardTab('investigation');
                        }}
                        isLight={isLight}
                      />
                    )}

                    {dashboardTab === 'conversations' && (
                      <ConversationsView
                        onSelectCase={(cId) => {
                          setSelectedCase(typeof cId === 'object' && cId !== null ? cId : {
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
                            flags: ['BAKSOS MASSAL', 'SIP MUTASI']
                          });
                          setDashboardTab('investigation');
                        }}
                        isLight={isLight}
                      />
                    )}

                    {dashboardTab === 'interventions' && (
                      <InterventionsView
                        onSelectCase={(cId) => {
                          setSelectedCase(typeof cId === 'object' && cId !== null ? cId : {
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
                            flags: ['BAKSOS MASSAL', 'SIP MUTASI']
                          });
                          setDashboardTab('investigation');
                        }}
                        isLight={isLight}
                      />
                    )}

                    {dashboardTab === 'database_viewer' && (
                      <DatabaseViewerView isLight={isLight} />
                    )}

                    {dashboardTab === 'queue' && (
                      <TriageOverview 
                        onSelectCase={(c) => {
                          setSelectedCase(c);
                          setDashboardTab('investigation');
                        }} 
                        isLight={isLight}
                      />
                    )}

                    {dashboardTab === 'investigation' && (
                      <CaseInvestigation 
                        caseData={selectedCase}
                        s1={s1}
                        s2={s2}
                        s3={s3}
                        patientResponse={patientResponse}
                        onBackToQueue={() => setDashboardTab('queue')}
                        onOpenGraph={() => setDashboardTab('graph')}
                        onOpenDecision={() => setDashboardTab('decision')}
                        onOpenAgentCopilot={() => setDashboardTab('agent_copilot')}
                        isLight={isLight}
                      />
                    )}

                    {dashboardTab === 'health_ai_chat' && (
                      <HealthAIChatView 
                        onNavigateTab={(tab) => setDashboardTab(tab)}
                        currentUser={currentUser}
                        isLight={isLight}
                      />
                    )}

                    {dashboardTab === 'agent_copilot' && (
                      <AgentCopilot 
                        selectedClaimId={selectedCase?.id || 'CLM-2026-10-085'}
                        onGoToCase={() => setDashboardTab('investigation')}
                        onGoToDecision={() => setDashboardTab('decision')}
                        onGoToAudit={() => setDashboardTab('audit')}
                        isLight={isLight}
                      />
                    )}

                    {dashboardTab === 'graph' && (
                      <GraphVisualizer 
                        caseData={selectedCase}
                        patientResponse={patientResponse}
                        onBackToInvestigation={() => setDashboardTab('investigation')}
                        onOpenDecision={() => setDashboardTab('decision')}
                        isLight={isLight}
                      />
                    )}

                    {dashboardTab === 'empirical' && (
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
                            flags: ['REPEAT BILLING', 'SAME-DAY SPLIT']
                          });
                          setDashboardTab('investigation');
                        }}
                      />
                    )}

                    {dashboardTab === 'faskes' && (
                      <FaskesSurveillance 
                        isLight={isLight}
                        onSelectFaskesCase={(cId) => {
                          setSelectedCase({
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
                            flags: ['BAKSOS MASSAL', 'SIP MUTASI']
                          });
                          setDashboardTab('investigation');
                        }}
                        onSelectHospital={(h) => {
                          // View or filter hospital
                        }}
                      />
                    )}

                    {dashboardTab === 'dpjp' && (
                      <DpjpIntelligence 
                        onSelectCase={(cId) => {
                          let caseDetails = {
                            id: cId,
                            sep: `0132R0011026V${cId.slice(-6)}`,
                            hospital: 'RSUD Dr. Moewardi Surakarta',
                            hospitalType: 'FKRTL (RS Pemerintah Kelas A)',
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
                            notes: 'Anomali Geovelocity Impossible Travel: DPJP tercatat operasi di Surakarta dan Semarang dalam selisih 45 menit (kecepatan mustahil 140.5 km/jam).',
                            flags: ['GEOVELOCITY ALERT', 'IMPOSSIBLE TRAVEL', 'SIP EXPIRED']
                          };
                          if (cId.includes('0744') || cId.includes('0751')) {
                            caseDetails = {
                              ...caseDetails,
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
                              flags: ['OVERCAPACITY', 'BEBAN HARIAN TINGGI']
                            };
                          } else if (cId.includes('0612') || cId.includes('0619')) {
                            caseDetails = {
                              ...caseDetails,
                              hospital: 'RS Hermina Solo',
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
                              flags: ['SIP KADALUWARSA', 'KLAIM ILEGAL']
                            };
                          } else if (cId.includes('0921')) {
                            caseDetails = {
                              ...caseDetails,
                              hospital: 'RSUD Dr. Moewardi Surakarta',
                              hospitalType: 'RS Pemerintah (Kelas A)',
                              code: 'U-3-12-0',
                              description: 'Pemeriksaan Radiologi Lanjut - Beban Bacaan 65 Pasien/Hari',
                              tariff: 'Rp 42.000.000',
                              dpjp: 'dr. Farhan Malik, Sp.Rad',
                              sipNumber: 'SIP.503/7712/DPMPTSP/2023',
                              totalScore: 76.0,
                              lane: 'red',
                              status: 'AUDIT OVERCAPACITY MERAH',
                              notes: 'Beban harian 65 ekspertise radiologi/hari melampaui ambang batas rasional Permenkes 14/2021.',
                              flags: ['OVERCAPACITY', 'BEBAN RADIOLOGI TINGGI']
                            };
                          } else if (cId.includes('1002')) {
                            caseDetails = {
                              ...caseDetails,
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
                              flags: ['GEOVELOCITY ALERT', 'IMPOSSIBLE TRAVEL', 'SIP MUTASI']
                            };
                          }
                          setSelectedCase(caseDetails);
                          setDashboardTab('investigation');
                        }}
                        isLight={isLight}
                      />
                    )}

                    {dashboardTab === 'mobile_bridge' && (
                      <MobileTelemetry 
                        onTriggerPush={triggerSimulation}
                        onToggleSimulator={toggleSimulation}
                        onCloseSimulator={closeSimulator}
                        isSimulatorOpen={viewMode === 'split' || viewMode === 'mobile'}
                        patientResponse={patientResponse}
                        onResetDemo={resetDemo}
                        isLight={isLight}
                      />
                    )}

                    {dashboardTab === 'decision' && (
                      <DecisionConsole 
                        caseData={selectedCase}
                        totalScore={totalScore}
                        s1={s1}
                        s2={s2}
                        s3={s3}
                        patientResponse={patientResponse}
                        verificatorAction={verificatorAction}
                        onSetVerificatorAction={setVerificatorAction}
                        onBackToInvestigation={() => setDashboardTab('investigation')}
                        onBackToQueue={() => setDashboardTab('queue')}
                        isLight={isLight}
                      />
                    )}

                    {dashboardTab === 'audit' && (
                      <AuditLedger isLight={isLight} />
                    )}

                    {dashboardTab === 'profile' && (
                      <AdminProfileView
                        currentUser={currentUser}
                        onUpdateUser={(updated) => setCurrentUser(updated)}
                        onBackToDashboard={() => setDashboardTab('executive')}
                        isLight={isLight}
                      />
                    )}

                    {dashboardTab === 'settings' && (
                      <AdminSettingsView
                        currentTheme={theme}
                        onThemeChange={setTheme}
                        onBackToDashboard={() => setDashboardTab('executive')}
                        isLight={isLight}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

              </div>
            )}

          </div>
        </main>
      </div>

      {/* FOOTER (FUTURISTIC STATUS & LEGAL STRIP) */}
      <footer className={`py-2 px-4 flex flex-col sm:flex-row items-center justify-between text-xs gap-2 shrink-0 z-20 select-none transition-all ${
        isLight
          ? 'bg-white/95 border-t border-slate-200 text-slate-600 shadow-xs'
          : 'bg-[#000c24]/90 backdrop-blur-md border-t border-white/10 text-white/50'
      }`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>ClaimTrace © 2026</span>
          <span className={isLight ? 'text-slate-300' : 'text-white/20'}>·</span>
          <span className={isLight ? 'text-slate-600' : 'text-white/70'}>Sistem Deteksi Dini Anomali Klaim BPJS Kesehatan</span>
          <span className={`hidden md:inline px-1.5 py-0.5 rounded text-[10px] font-mono border ${
            isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-white/10 text-white/60 border-white/10'
          }`}>
            KC Surakarta · Kedeputian Wilayah VI
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
          <span className={isLight ? 'text-slate-500' : 'text-white/40'}>Kepatuhan:</span>
          <button 
            onClick={() => openLegalModal('privacy')} 
            className={`font-medium underline underline-offset-2 transition cursor-pointer ${
              isLight ? 'text-slate-700 hover:text-emerald-700' : 'text-white/70 hover:text-[#FFCA40]'
            }`}
          >
            UU PDP No. 27/2022
          </button>
          <span className={isLight ? 'text-slate-300' : 'text-white/20'}>•</span>
          <button 
            onClick={() => openLegalModal('sla')} 
            className={`font-medium underline underline-offset-2 transition cursor-pointer ${
              isLight ? 'text-slate-700 hover:text-emerald-700' : 'text-white/70 hover:text-[#FFCA40]'
            }`}
          >
            Perpres No. 82/2018 (SLA 10 Hari)
          </button>
          <span className={isLight ? 'text-slate-300' : 'text-white/20'}>•</span>
          <button 
            onClick={() => openLegalModal('terms')} 
            className={`font-medium underline underline-offset-2 transition cursor-pointer ${
              isLight ? 'text-slate-700 hover:text-emerald-700' : 'text-white/70 hover:text-[#FFCA40]'
            }`}
          >
            Permenkes No. 14/2021
          </button>
          <span className={isLight ? 'text-slate-300' : 'text-white/20'}>•</span>
          <button 
            type="button"
            onClick={() => openLegalModal('security')} 
            className={`font-medium underline underline-offset-2 transition cursor-pointer ${
              isLight ? 'text-slate-700 hover:text-emerald-700' : 'text-white/70 hover:text-[#FFCA40]'
            }`}
          >
            ISO 27001
          </button>
          <span className={isLight ? 'text-slate-300' : 'text-white/20'}>•</span>
          <button 
            type="button"
            onClick={() => openLegalModal('frameworks')} 
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold underline underline-offset-2 transition cursor-pointer flex items-center gap-1"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400 inline" />
            <span>MITRE F3 &amp; ATT&amp;CK</span>
          </button>
        </div>
      </footer>
    </motion.div>
      )}
    </AnimatePresence>

    {/* INSTITUTIONAL LEGAL & COMPLIANCE MODAL (UU PDP, TERMS, SECURITY, SLA) */}
    <InstitutionalLegalModal 
      isOpen={legalModalOpen}
      onClose={() => setLegalModalOpen(false)}
      initialTab={legalModalTab}
      isLight={isLight}
    />

    {/* INSTITUTIONAL COOKIE & TELEMETRY CONSENT BANNER (UU PDP) */}
    {authView === 'landing' && (
      <CookieConsentBanner 
        onOpenPrivacy={() => openLegalModal('privacy')}
      />
    )}

    {/* FLOATING ORCHESTRATOR ASISTEN AUDIT JKN (AI) WIDGET */}
    {authView === 'dashboard' && dashboardTab !== 'health_ai_chat' && (
      <HealthAIChatWidget 
        onOpenFullScreen={() => setDashboardTab('health_ai_chat')} 
        onNavigateTab={(t) => setDashboardTab(t)} 
        isLight={isLight}
      />
    )}
  </>
  );
}

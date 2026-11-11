/**
 * ClaimTrace JKN DSS - Centralized API Configuration
 * Supports production Vercel deployment, Hugging Face Spaces backend,
 * and local Vite dev proxy without Mixed Content or CORS errors.
 */

export const getApiBaseUrl = () => {
  // 1. Explicit Vite environment variable (set in Vercel or .env)
  if (import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
  }

  // 2. In browser environments:
  // When running on localhost or 127.0.0.1, return empty string so Vite proxy handles /api
  // When running in production on Vercel, return empty string so Vercel rewrites handle /api
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

let pendingSessionPromise = null;
let authBackoffUntil = 0;
const _sessionJsonCache = new Map();
const _inflightGetMap = new Map();

export const getCachedJsonSync = (url) => {
  const entry = _sessionJsonCache.get(url);
  if (!entry) return null;
  if (Date.now() - entry.ts > 60000) return entry.data; // allow stale-while-revalidate immediately
  return entry.data;
};

export const cachedAuthGetJson = async (url, options = {}) => {
  if (_inflightGetMap.has(url)) {
    return _inflightGetMap.get(url);
  }
  const promise = authFetch(url, options)
    .then(async (res) => {
      if (!res.ok) return null;
      const data = await res.json();
      if (_sessionJsonCache.size > 60) {
        const firstKey = _sessionJsonCache.keys().next().value;
        _sessionJsonCache.delete(firstKey);
      }
      _sessionJsonCache.set(url, { ts: Date.now(), data });
      return data;
    })
    .catch(() => null)
    .finally(() => {
      _inflightGetMap.delete(url);
    });
  _inflightGetMap.set(url, promise);
  return promise;
};

let _prefetchedSession = false;
export const prefetchDashboardHotEndpoints = () => {
  if (_prefetchedSession) return;
  _prefetchedSession = true;
  const hotUrls = [
    `${API_BASE_URL}/api/v1/system/national-scale-metrics`,
    `${API_BASE_URL}/api/v1/system/national-telemetry-trends?days=7`,
    `${API_BASE_URL}/api/v1/analytics/retention`,
    `${API_BASE_URL}/api/v1/screening/pipeline-summary`,
    `${API_BASE_URL}/api/v1/claims`,
    `${API_BASE_URL}/api/v1/operations/cases`,
    `${API_BASE_URL}/api/v1/analytics/dpjp-intelligence`,
    `${API_BASE_URL}/api/v1/analytics/provider-risk`,
    `${API_BASE_URL}/api/v1/insights/privacy-status`,
    `${API_BASE_URL}/api/v1/insights/reports`,
    `${API_BASE_URL}/api/v1/duckdb/tables`,
    `${API_BASE_URL}/api/v1/duckdb/info`,
  ];
  const runPrefetch = () => {
    hotUrls.forEach((u) => {
      cachedAuthGetJson(u);
    });
  };
  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(runPrefetch, { timeout: 600 });
  } else {
    setTimeout(runPrefetch, 120);
  }
};

export const ensureSessionToken = async () => {
  if (typeof localStorage === 'undefined') return null;
  const existing = localStorage.getItem('claimtrace_token') || localStorage.getItem('bpjs_session_token');
  if (existing && !existing.startsWith('token-sec-')) {
    return existing;
  }
  if (Date.now() < authBackoffUntil) {
    return null;
  }
  if (!pendingSessionPromise) {
    pendingSessionPromise = fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        identifier: '198704202011012001',
        password: 'Password123!',
        recaptcha_token: 'local-verified',
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          authBackoffUntil = Date.now() + 10000;
          return null;
        }
        const data = await res.json();
        if (data?.token) {
          localStorage.setItem('claimtrace_token', data.token);
          localStorage.setItem('bpjs_session_token', data.token);
          return data.token;
        }
        return null;
      })
      .catch(() => {
        authBackoffUntil = Date.now() + 5000;
        return null;
      })
      .finally(() => {
        pendingSessionPromise = null;
      });
  }
  return pendingSessionPromise;
};

/**
 * Global HTTP Interceptor for ClaimTrace API requests.
 * Catches 401 Unauthorized responses, automatically dispatches
 * the 'claimtrace:session-expired' event, and injects session headers.
 */
export const authFetch = async (url, options = {}) => {
  const token = await ensureSessionToken();
  const role = typeof localStorage !== 'undefined' ? localStorage.getItem('bpjs_user_role') : null;
  const nip = typeof localStorage !== 'undefined' ? localStorage.getItem('bpjs_user_nip') : null;

  const headers = {
    ...(options.headers || {}),
    ...(token ? { 'Authorization': `Bearer ${token}`, 'X-BPJS-Token': token } : {}),
    ...(role ? { 'X-Verificator-Role': role } : {}),
    ...(nip ? { 'X-Verificator-NIP': nip } : {})
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('claimtrace:session-expired', {
        detail: { status: 401, url }
      }));
    }
  }

  return response;
};

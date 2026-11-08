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

export const ensureSessionToken = async () => {
  if (typeof localStorage === 'undefined') return null;
  const existing = localStorage.getItem('claimtrace_token') || localStorage.getItem('bpjs_session_token');
  if (existing && !existing.startsWith('token-sec-')) {
    return existing;
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
        if (!res.ok) return null;
        const data = await res.json();
        if (data?.token) {
          localStorage.setItem('claimtrace_token', data.token);
          localStorage.setItem('bpjs_session_token', data.token);
          return data.token;
        }
        return null;
      })
      .catch(() => null)
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

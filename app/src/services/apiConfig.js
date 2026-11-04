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

/**
 * Global HTTP Interceptor for ClaimTrace API requests.
 * Catches 401 Unauthorized responses, automatically dispatches
 * the 'claimtrace:session-expired' event, and injects session headers.
 */
export const authFetch = async (url, options = {}) => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('bpjs_session_token') : null;
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

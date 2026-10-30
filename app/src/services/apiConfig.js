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

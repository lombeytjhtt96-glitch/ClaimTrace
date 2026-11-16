import { lazy } from 'react';

const CHUNK_RELOAD_GUARD_KEY = 'claimtrace_chunk_reload_at';
const CHUNK_RELOAD_COOLDOWN_MS = 15000;

/**
 * Detects stale Vite dynamic-import errors triggered after a rebuild or server mode switch.
 */
export function isChunkLoadError(error) {
  const msg = String(error?.message || error || '').toLowerCase();
  return (
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('importing a module script failed') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('loading chunk') ||
    msg.includes('chunkloaderror')
  );
}

/**
 * Wraps React.lazy with automatic one-shot page reload recovery when a stale chunk is requested.
 */
export default function lazyWithRetry(importer) {
  return lazy(async () => {
    try {
      const mod = await importer();
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(CHUNK_RELOAD_GUARD_KEY);
      }
      return mod;
    } catch (error) {
      if (typeof window !== 'undefined' && isChunkLoadError(error)) {
        let lastReloadAt = 0;
        try {
          lastReloadAt = Number(window.sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY) || '0');
        } catch {
          lastReloadAt = 0;
        }
        const now = Date.now();
        if (!lastReloadAt || now - lastReloadAt > CHUNK_RELOAD_COOLDOWN_MS) {
          try {
            window.sessionStorage.setItem(CHUNK_RELOAD_GUARD_KEY, String(now));
          } catch {
            // Ignore sessionStorage restrictions in hardened browsers
          }
          window.location.reload();
          return new Promise(() => {});
        }
      }
      throw error;
    }
  });
}

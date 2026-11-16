import { useEffect, useState } from 'react';

const resolveIsLightTheme = (propIsLight) => {
  if (typeof propIsLight === 'boolean') return propIsLight;
  if (typeof window !== 'undefined') {
    const queryTheme = new URLSearchParams(window.location.search).get('theme');
    if (queryTheme === 'light') return true;
    if (queryTheme === 'dark') return false;
  }
  if (typeof document !== 'undefined') {
    const root = document.getElementById('cockpit-root');
    if (root) return root.classList.contains('theme-light');
    return document.documentElement.classList.contains('light');
  }
  return false;
};

/**
 * Subscribe cleanly to ClaimTrace cockpit light/dark theme changes across URL,
 * prop override, and the `#cockpit-root` class observer.
 */
export function useCockpitTheme(propIsLight) {
  const [internalIsLight, setInternalIsLight] = useState(() => resolveIsLightTheme(propIsLight));

  useEffect(() => {
    if (typeof propIsLight === 'boolean') {
      setInternalIsLight(propIsLight);
      return;
    }
    const syncTheme = () => {
      if (typeof document === 'undefined') return;
      const root = document.getElementById('cockpit-root');
      if (root) setInternalIsLight(root.classList.contains('theme-light'));
      else setInternalIsLight(document.documentElement.classList.contains('light'));
    };
    syncTheme();
    const target = typeof document !== 'undefined' ? (document.getElementById('cockpit-root') || document.documentElement) : null;
    if (!target || typeof MutationObserver === 'undefined') return undefined;
    const observer = new MutationObserver(syncTheme);
    observer.observe(target, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [propIsLight]);

  return typeof propIsLight === 'boolean' ? propIsLight : internalIsLight;
}

export default useCockpitTheme;

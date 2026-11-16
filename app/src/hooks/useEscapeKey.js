import { useEffect } from 'react';

/**
 * Close active modal or drawer overlays when the user presses Escape.
 */
export function useEscapeKey(isActive, onEscape) {
  useEffect(() => {
    if (!isActive || typeof window === 'undefined') return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onEscape?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onEscape]);
}

export default useEscapeKey;

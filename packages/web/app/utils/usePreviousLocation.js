import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

/**
 * Returns the location at (current history index - 1), i.e., where `navigate(-1)` would land,
 * based on locations visited in this session. Returns null if the previous history entry hasn't
 * been visited in this session (e.g. the user navigated directly to a deep link).
 *
 * Tracks by `window.history.state.idx` so that replace-mode navigations (e.g. tab switching)
 * overwrite the same index slot instead of shifting the previous pointer.
 */
export function usePreviousLocation() {
  const location = useLocation();
  const historyMapRef = useRef({});

  useEffect(() => {
    const idx = window.history.state?.idx;
    if (idx !== undefined) {
      historyMapRef.current[idx] = location;
    }
  }, [location]);

  const currentIdx = window.history.state?.idx;
  if (currentIdx === undefined || currentIdx === 0) {
    return null;
  }
  return historyMapRef.current[currentIdx - 1] ?? null;
}

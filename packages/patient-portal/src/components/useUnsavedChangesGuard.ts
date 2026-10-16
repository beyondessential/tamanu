import { useEffect, useRef } from 'react';
import { useBlocker } from 'react-router';

/**
 * Holds navigation to another page while there are unsaved changes, so the page can ask before
 * dropping them, and warns before the tab closes. Call `allowLeaving` just before navigating away
 * once the changes are saved.
 */
export const useUnsavedChangesGuard = (hasUnsavedChanges: boolean) => {
  const isLeavingAfterSave = useRef(false);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges &&
      !isLeavingAfterSave.current &&
      currentLocation.pathname !== nextLocation.pathname &&
      // Signing out goes to the sign-in page, and has already discarded the session
      !nextLocation.pathname.startsWith('/login'),
  );

  useEffect(() => {
    if (!hasUnsavedChanges) return undefined;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasUnsavedChanges]);

  return {
    blocker,
    allowLeaving: () => {
      isLeavingAfterSave.current = true;
    },
  };
};

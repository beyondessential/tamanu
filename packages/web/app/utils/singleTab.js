import { useState, useEffect } from 'react';

const tabStart = Date.now();
const channel = new BroadcastChannel('tamanuSingleTab');

/**
 * The patient self check-in kiosk is often open on a staff computer beside Tamanu, so a kiosk tab
 * takes no part in the one-tab rule: it never claims to be the primary tab, and is never blocked.
 */
const isKioskTab = () => window.location.pathname.startsWith('/kiosk');

export const useSingleTab = () => {
  const [isPrimaryTab, setIsPrimaryTab] = useState(true);

  useEffect(() => {
    if (isKioskTab()) return undefined;

    const listener = (event) => {
      const otherTabStart = event.data;

      if (otherTabStart < tabStart) {
        // Another tab is older than this one
        setIsPrimaryTab(false);
        channel.removeEventListener('message', listener);
      } else if (isPrimaryTab) {
        // another tab is checking if it's the primary - current tab is primary
        channel.postMessage(tabStart);
      }
    };

    channel.addEventListener('message', listener);
    channel.postMessage(tabStart);

    return () => {
      channel.removeEventListener('message', listener);
    };
  }, []);

  return isPrimaryTab;
};

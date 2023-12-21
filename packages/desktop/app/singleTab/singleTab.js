import { useState, useEffect } from 'react';

const newTabChannel = new BroadcastChannel('tamanuNewTab');
const primaryTabChannel = new BroadcastChannel('tamanuPrimaryTab');

export const useSingleTab = () => {
  const [isPrimaryTab, setIsPrimaryTab] = useState(true);

  const newTabListener = () => {
    // Tell any new tabs that a primary tab exists
    primaryTabChannel.postMessage('primaryTab');
  };

  const primaryTabListener = () => {
    // If a message is received on the primary tab channel, we know that this tab is not the primary tab
    setIsPrimaryTab(false);
    sessionStorage.removeItem('wasPrimaryTab');
    newTabChannel.removeEventListener('message', newTabListener);
  };

  useEffect(() => {
    const wasPrimaryTab = sessionStorage.getItem('wasPrimaryTab');
    const isDuplicateTab = sessionStorage.getItem('currentlyOpen');
    sessionStorage.setItem('currentlyOpen', 'true');

    newTabChannel.addEventListener('message', newTabListener);

    if (!wasPrimaryTab || isDuplicateTab) {
      // Assume that this is a primary tab until told otherwise
      sessionStorage.setItem('wasPrimaryTab', 'true');
      primaryTabChannel.addEventListener('message', primaryTabListener);
      newTabChannel.postMessage('newTab');
    }

    return () => {
      // Clean up listeners on demount
      newTabChannel.removeEventListener('message', newTabListener);
      primaryTabChannel.removeEventListener('message', primaryTabListener);
      sessionStorage.removeItem('currentlyOpen');
    };
  }, []);

  return isPrimaryTab;
};

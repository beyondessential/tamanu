import { useState, useEffect } from 'react';

const tabStart = Date.now();
const channel = new BroadcastChannel('tamanuSingleTab');

export const useSingleTab = () => {
  const [isPrimaryTab, setIsPrimaryTab] = useState(true);

  useEffect(() => {
    const listener = event => {
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

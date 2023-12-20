import { useState, useEffect } from 'react';

export const useSingleTab = () => {
  const [isPrimaryTab, setIsPrimaryTab] = useState(true);
  const channel = new BroadcastChannel('tamanuSingleTab');

  useEffect(() => {
    const wasPrimaryTab = sessionStorage.getItem('wasPrimaryTab');
    let startTime = parseInt(sessionStorage.getItem('startTime'));
    if (!startTime) {
      startTime = Date.now();
      sessionStorage.setItem('startTime', startTime);
    }

    console.log('start time', startTime);

    const handleBroadcastMessage = event => {
      const otherTabStart = event.data;

      if (wasPrimaryTab) {
        channel.postMessage(otherTabStart - 1);
        return;
      }

      if (otherTabStart < startTime) {
        setIsPrimaryTab(false);
      } else if (isPrimaryTab) {
        channel.postMessage(startTime);
        sessionStorage.setItem('wasPrimaryTab', 'true');
      }
    };

    channel.addEventListener('message', handleBroadcastMessage);
    channel.postMessage(startTime);

    return () => {
      channel.removeEventListener('message', handleBroadcastMessage);
    };
  }, [isPrimaryTab, channel]);

  return isPrimaryTab;
};

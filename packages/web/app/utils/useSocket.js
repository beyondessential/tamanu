import io from 'socket.io-client';
import { useEffect, useState } from 'react';
import { WS_PATH } from '@tamanu/constants';

let cachedSocket;

export const useSocket = () => {
  const [socket] = useState(() => {
    return (cachedSocket = io('', {
      path: WS_PATH,
      transports: ['websocket'],
    }));
  });

  useEffect(() => {
    return () => {
      cachedSocket?.disconnect();
    };
  }, []);

  return {
    socket,
  };
};

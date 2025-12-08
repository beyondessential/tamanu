import io from 'socket.io-client';
import { useEffect, useState } from 'react';
import config from 'config';

let cachedSocket;

export const useSocket = () => {
  const [socket] = useState(() => {
    if (!config['socket.io'].enabled) return null;
    return (cachedSocket = io('', {
      path: '/api/socket.io/',
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

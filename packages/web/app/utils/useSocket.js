import io from 'socket.io-client';
import { useEffect, useState } from 'react';

let cachedSocket;

export const useSocket = () => {
  const [socket] = useState(() => {
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

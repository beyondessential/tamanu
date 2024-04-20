import io from 'socket.io-client';
import { useEffect } from 'react';

export const useSocket = () => {
  const initSocket = () => {
    return io(undefined, {
      transports: ['websocket'],
    });
  };
  
  const socket = initSocket();

  useEffect(() => {
    return () => {
      socket.disconnect();
    };
  }, []);

  return {
    socket,
  };
};

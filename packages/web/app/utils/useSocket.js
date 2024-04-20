import { useEffect } from 'react';
import io from 'socket.io-client';

const socket = io({
  autoConnect: false
});

export const useSocket = () => {
  useEffect(() => {
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, []);

  return {
    socket,
  };
};

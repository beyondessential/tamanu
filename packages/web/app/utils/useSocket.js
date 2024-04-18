import io from 'socket.io-client';
import { useEffect } from 'react';

const initSocket = (settings) => {
  const serverLocation = window.location.origin;
  return io(serverLocation, settings);
};

export const useSocket = (props) => {
  const { ...settings } = props || {};
  const socket = initSocket(settings);

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

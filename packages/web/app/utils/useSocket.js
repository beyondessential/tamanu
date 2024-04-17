import io from 'socket.io-client';
import { useEffect, useState } from 'react';

export const useSocket = (props) => {
  const { uri, ...otherSettings } = props || {};
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    initSocket();
    return () => {
      socket?.disconnect();
    };
  }, [uri]);

  const initSocket = () => {
    const serverLocation = window.location.origin;
    const newSocket = io(uri || serverLocation, otherSettings)
    setSocket(newSocket);
  };

  return {
    socket,
  };
};

import io from 'socket.io-client';
import { useEffect, useState } from 'react';

const cachedWebSocketInstances = {};

export const useSocket = () => {
  const connectionUrl = '/api';

  const initializeSocketInstance = () => {
    const cached = cachedWebSocketInstances[connectionUrl];
    if (cached) {
      cachedWebSocketInstances[connectionUrl].count += 1;
      return cached.instance;
    }

    const newSocket = io(connectionUrl, { transports: ['webtransport', 'websocket'] });
    cachedWebSocketInstances[connectionUrl] = {
      instance: newSocket,
      count: 1,
    };
    return newSocket;
  };

  const [socket] = useState(initializeSocketInstance);

  useEffect(() => {
    return () => {
      if (cachedWebSocketInstances[connectionUrl]?.count > 1) {
        cachedWebSocketInstances[connectionUrl].count -= 1;
        return;
      }

      delete cachedWebSocketInstances[connectionUrl];
      socket?.disconnect();
    };
  }, []);

  return {
    socket,
  };
};

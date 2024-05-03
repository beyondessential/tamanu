import io, { Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';
import { readConfig } from '~/services/config';

interface Props {
  uri?: string;
}

const cachedWebSocketInstances: Record<string, { instance: Socket; count: number }> = {};

export const useSocket = (props: Props = {}) => {
  const { uri } = props;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionUrl, setConnectionUrl] = useState('');

  useEffect(() => {
    setupConnectionUrl();
  }, []);

  useEffect(() => {
    if (!connectionUrl) return;
    initSocket();
    return () => {
      if (cachedWebSocketInstances[connectionUrl]?.count > 1) {
        cachedWebSocketInstances[connectionUrl].count -= 1;
        return;
      }

      delete cachedWebSocketInstances[connectionUrl];
      socket?.disconnect();
    };
  }, [connectionUrl]);

  const setupConnectionUrl = async () => {
    const syncServerLocation = await readConfig('syncServerLocation');
    const connectionUrl = uri || syncServerLocation;
    setConnectionUrl(connectionUrl);
  };

  const initSocket = async () => {
    const cached = cachedWebSocketInstances[connectionUrl];
    if (cached) {
      cachedWebSocketInstances[connectionUrl].count += 1;
      setSocket(cached.instance);
    }

    const newSocket = io(connectionUrl, { transports: ['websocket'] });
    cachedWebSocketInstances[connectionUrl] = {
      instance: newSocket,
      count: 1,
    };
    setSocket(newSocket);
  };

  return {
    socket,
  };
};

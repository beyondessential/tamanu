import io, { Socket } from 'socket.io-client';
import { useCallback, useEffect, useState } from 'react';
import { readConfig } from '~/services/config';

interface Props {
  uri?: string;
}

const cachedWebSocketInstances: Record<string, { instance: Socket; count: number }> = {};

export const useSocket = (props: Props = {}) => {
  const { uri } = props;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionUrl, setConnectionUrl] = useState('');

  const setupConnectionUrl = useCallback(async () => {
    const syncServerLocation = await readConfig('syncServerLocation');
    const connectionUrl = uri || syncServerLocation;
    setConnectionUrl(connectionUrl);
  }, [uri]);

  const initSocket = useCallback(async () => {
    if (!connectionUrl) return;

    const cached = cachedWebSocketInstances[connectionUrl];
    if (cached) {
      cachedWebSocketInstances[connectionUrl].count += 1;
      setSocket(cached.instance);
      return;
    }

    const newSocket = io(connectionUrl, { transports: ['websocket'] });
    cachedWebSocketInstances[connectionUrl] = {
      instance: newSocket,
      count: 1,
    };
    setSocket(newSocket);
  }, [connectionUrl]);

  useEffect(() => {
    setupConnectionUrl();
  }, [setupConnectionUrl]);

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
  }, [connectionUrl, initSocket, socket]);

  return {
    socket,
  };
};

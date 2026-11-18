import io, { type Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';
import { readConfig } from '~/services/config';
import { WS_PATH } from '@tamanu/constants';
import { keepSocketConnected } from '@tamanu/utils';
import { useBackend } from '~/ui/hooks';

export const useSocket = () => {
  const { centralServer } = useBackend();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionUrl, setConnectionUrl] = useState('');

  const setupConnectionUrl = async () => {
    setConnectionUrl(await readConfig('syncServerLocation'));
  };

  useEffect(() => {
    setupConnectionUrl();
  }, []);

  useEffect(() => {
    if (!connectionUrl) return;
    const newSocket = io(connectionUrl, {
      path: WS_PATH,
      transports: ['websocket'],
      // Read on every attempt, so a reconnection carries the current token
      auth: sendToken => sendToken({ token: centralServer.token }),
    });

    const stopReconnecting = keepSocketConnected(newSocket, {
      refreshCredentials: () => centralServer.refresh(),
    });

    setSocket(newSocket);
    return () => {
      stopReconnecting();
      newSocket.disconnect();
    };
  }, [connectionUrl, centralServer]);

  return {
    socket,
  };
};

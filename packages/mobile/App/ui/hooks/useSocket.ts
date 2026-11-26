import io, { type Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';
import { readConfig } from '~/services/config';
import { WS_PATH } from '@tamanu/constants';
import { keepSocketConnected } from '@tamanu/utils';
import { useBackend } from '~/ui/hooks';
import type { CentralServerConnection } from '~/services/sync';

// One connection is shared by every consumer of this hook, so screens that listen at the same time
// don't each hold a connection and each refresh the token when it lapses. It is closed once the
// last consumer unmounts.
let sharedSocket: Socket | null = null;
let stopReconnectingSharedSocket: (() => void) | null = null;
let consumerCount = 0;

const acquireSharedSocket = (connectionUrl: string, centralServer: CentralServerConnection) => {
  consumerCount += 1;
  if (sharedSocket) return sharedSocket;

  sharedSocket = io(connectionUrl, {
    path: WS_PATH,
    transports: ['websocket'],
    // Read on every attempt, so a reconnection carries the current token
    auth: sendToken => sendToken({ token: centralServer.token }),
  });
  stopReconnectingSharedSocket = keepSocketConnected(sharedSocket, {
    refreshCredentials: () => centralServer.refresh(),
  });
  return sharedSocket;
};

const releaseSharedSocket = () => {
  consumerCount -= 1;
  if (consumerCount > 0) return;

  stopReconnectingSharedSocket?.();
  stopReconnectingSharedSocket = null;
  sharedSocket?.disconnect();
  sharedSocket = null;
};

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
    setSocket(acquireSharedSocket(connectionUrl, centralServer));
    return releaseSharedSocket;
  }, [connectionUrl, centralServer]);

  return {
    socket,
  };
};

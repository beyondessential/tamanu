import io, { type Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';
import { readConfig } from '~/services/config';
import { WS_PATH } from '@tamanu/constants';
import { useBackend } from '~/ui/hooks';

// socket.io only retries a connection on its own after a transport failure. The server ending the
// connection, or refusing it for a missing or expired token, needs a manual retry.
const RECONNECT_DELAY_MS = 5000;

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

    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    const reconnectLater = () => {
      if (newSocket.active) return;
      reconnectTimer = setTimeout(() => newSocket.connect(), RECONNECT_DELAY_MS);
    };
    newSocket.on('connect_error', reconnectLater);
    newSocket.on('disconnect', reconnectLater);

    setSocket(newSocket);
    return () => {
      clearTimeout(reconnectTimer);
      newSocket.off('connect_error', reconnectLater);
      newSocket.off('disconnect', reconnectLater);
      newSocket.disconnect();
    };
  }, [connectionUrl, centralServer]);

  return {
    socket,
  };
};

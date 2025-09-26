import io, { type Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';
import { readConfig } from '~/services/config';

let cachedSocket: undefined | Socket;

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionUrl, setConnectionUrl] = useState('');

  const setupConnectionUrl = async () => {
    const syncServerLocation = await readConfig('syncServerLocation');
    const url = new URL(syncServerLocation);
    url.pathname = '/api';
    setConnectionUrl(url.toString());
  };

  useEffect(() => {
    setupConnectionUrl();
  }, []);

  useEffect(() => {
    if (!connectionUrl) return;
    setSocket(
      (cachedSocket = io(connectionUrl, {
        path: '/api',
        transports: ['webtransport', 'websocket'],
      })),
    );
    return () => {
      cachedSocket?.disconnect();
    };
  }, [connectionUrl]);

  return {
    socket,
  };
};

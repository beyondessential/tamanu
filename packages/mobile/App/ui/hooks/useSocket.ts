import io, { type Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';
import { readConfig } from '~/services/config';

let cachedSocket: undefined | Socket;

export const useSocket = () => {
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
    setSocket(
      (cachedSocket = io(connectionUrl, {
        path: '/api/socket.io/',
        transports: ['websocket'],
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

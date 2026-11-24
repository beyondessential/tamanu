import { io } from 'socket.io-client';
import { WS_PATH } from '@tamanu/constants';

import { getSyncConfig } from '../serverConfig';

const NOOP_CLIENT_SERVICE = {
  getClient: () => null,
  emit: () => {},
  listenOnce: () => {},
  removeListener: () => {},
};

export const defineWebsocketClientService = () => {
  // No host until the server is configured — nothing to connect to, so no-op.
  const { host } = getSyncConfig();
  if (!host) {
    return NOOP_CLIENT_SERVICE;
  }

  const url = new URL(host);
  const client = io(url.toString(), { path: WS_PATH, transports: ['websocket', 'webtransport'] });
  const getClient = () => client;

  const emit = (eventName, ...args) => client.emit(eventName, ...args);

  const listenOnce = (eventName, callback) => client.once(eventName, callback);

  const removeListener = (eventName, callback) => client.off(eventName, callback);
  return {
    getClient,
    emit,
    listenOnce,
    removeListener,
  };
};

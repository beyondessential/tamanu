import { io } from 'socket.io-client';
import { WS_PATH } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { keepSocketConnected } from '@tamanu/utils/keepSocketConnected';

import { getSyncConfig } from '../serverConfig';
import { CentralServerConnection } from '../sync/CentralServerConnection';
import { getSyncSettings } from '../sync/syncSettings';

const NOOP_CLIENT_SERVICE = {
  getClient: () => null,
  emit: () => {},
  listenOnce: () => {},
  removeListener: () => {},
};

export const defineWebsocketClientService = ({ deviceId }) => {
  // No host until the server is configured — nothing to connect to, so no-op.
  const { host } = getSyncConfig();
  if (!host) {
    return NOOP_CLIENT_SERVICE;
  }

  const url = new URL(host);
  // Central only accepts connections from clients that hold an access token
  const centralServer = new CentralServerConnection({ deviceId });
  const logIn = async () => {
    try {
      await centralServer.connect(false, getSyncSettings().timeout);
    } catch (error) {
      log.warn(`Could not get a token for the central websocket: ${error}`);
    }
  };

  const client = io(url.toString(), {
    path: WS_PATH,
    transports: ['websocket', 'webtransport'],
    // Read on every attempt, so a reconnection carries the current token. Logging in happens
    // before the first attempt and before each retry after a refusal, never in the handshake.
    auth: sendToken => sendToken({ token: centralServer.getToken() }),
    autoConnect: false,
  });
  const getClient = () => client;
  keepSocketConnected(client, { refreshCredentials: logIn });
  logIn().then(() => client.connect());

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

import { io } from 'socket.io-client';
import { WS_EVENTS, WS_PATH } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { keepSocketConnected } from '@tamanu/utils/keepSocketConnected';

import { getSyncConfig } from '../serverConfig';
import { CentralServerConnection } from '../sync/CentralServerConnection';

const NOOP_CLIENT_SERVICE = {
  getClient: () => null,
  emit: () => {},
  listenOnce: () => {},
  removeListener: () => {},
};

/**
 *
 * @param {{config: import('config').IConfig, deviceId: string, websocketService: ReturnType<import('./websocketService').defineWebsocketService>, models: import('@tamanu/database/models')}} injector
 */
export const defineWebsocketClientService = injector => {
  // No host until the server is configured — nothing to connect to, so no-op.
  const { host } = getSyncConfig();
  if (!host) {
    return NOOP_CLIENT_SERVICE;
  }

  const url = new URL(host);
  // Central only accepts connections from clients that hold an access token
  const centralServer = new CentralServerConnection({ deviceId: injector.deviceId });
  const logIn = async () => {
    try {
      await centralServer.connect(false, injector.config.sync.timeout);
    } catch (error) {
      log.warn(`Could not get a token for the central websocket: ${error}`);
    }
  };

  const client = io(url.toString(), {
    path: WS_PATH,
    transports: ['websocket', 'webtransport'],
    // Run for every connection attempt, so a reconnection carries the current token
    auth: async sendToken => {
      if (!centralServer.hasToken()) await logIn();
      sendToken({ token: centralServer.getToken() });
    },
  });
  const getClient = () => client;
  keepSocketConnected(client, { refreshCredentials: logIn });

  //forward event to facility client
  client.on(
    WS_EVENTS.TELEGRAM_SUBSCRIBE,
    /**
     *
     * @param {{ contactId: string, chatId: string }} payload
     */
    async ({ chatId, contactId }) => {
      const contact = await injector.models?.PatientContact.findByPk(contactId);
      if (!contact) return;

      contact.connectionDetails = { chatId };
      await contact.save();

      injector.websocketService?.emit(WS_EVENTS.TELEGRAM_SUBSCRIBE_SUCCESS, { contactId, chatId });
    },
  );

  client.on(
    WS_EVENTS.TELEGRAM_UNSUBSCRIBE,
    /**
     *
     * @param {{ contactId: string }} payload
     */
    async ({ contactId }) => {
      const contact = await injector.models?.PatientContact.findByPk(contactId);
      if (!contact) return;

      await contact.destroy();
      injector.websocketService?.emit(WS_EVENTS.TELEGRAM_UNSUBSCRIBE_SUCCESS, { contactId });
    },
  );

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

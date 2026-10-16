import { io } from 'socket.io-client';
import { WS_EVENTS, WS_PATH } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';

import { getCentralEndpointSelector, getCurrentCentralHost } from '../sync/CentralEndpointSelector';

const NOOP_CLIENT_SERVICE = {
  getClient: () => null,
  emit: () => {},
  listenOnce: () => {},
};

/**
 *
 * @param {{websocketService: ReturnType<import('./websocketService').defineWebsocketService>, models: import('@tamanu/database/models')}} injector
 */
export const defineWebsocketClientService = injector => {
  // No host until the server is configured — nothing to connect to, so no-op.
  const host = getCurrentCentralHost();
  if (!host) {
    return NOOP_CLIENT_SERVICE;
  }

  const url = new URL(host);
  const client = io(url.toString(), { path: WS_PATH, transports: ['websocket', 'webtransport'] });
  const getClient = () => client;

  // spec: CEND
  // Follow the central endpoint in use. The listeners stay on the socket across the reconnect.
  getCentralEndpointSelector()?.on('change', newHost => {
    log.info('websocketClientService: reconnecting to the new central endpoint', { host: newHost });
    client.io.uri = new URL(newHost).toString();
    client.disconnect().connect();
  });

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
  return {
    getClient,
    emit,
    listenOnce,
  };
};

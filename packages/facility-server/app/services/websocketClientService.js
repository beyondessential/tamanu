import { io } from 'socket.io-client';

/**
 *
 * @param {{config: { sync: { host: string}, language: string}, websocketService: ReturnType<import('./websocketService').defineWebsocketService>, models: import('../../../shared/src/models')}} injector
 */
export const defineWebsocketClientService = injector => {
  const client = io(injector.config.sync.host);
  const getClient = () => client;

  //forward event to facility client
  client.on(
    'telegram:subscribe',
    /**
     *
     * @param {{ contactId: string, chatId: string }} payload
     */
    async ({ chatId, contactId }) => {
      const contact = await injector.models?.PatientContact.findByPk(contactId);
      if (!contact) return;

      contact.connectionDetails = { chatId };
      await contact.save();

      injector.websocketService.emit('telegram:subscribe:success', { contactId, chatId });
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

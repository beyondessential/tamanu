const { io } = require('socket.io-client');

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
      const getTranslation = await injector.models?.TranslatedString.getTranslationFunction(
        injector.config.language,
        ['telegramRegistration'],
      );

      const contact = await injector.models?.PatientContact.findByPk(contactId, {
        include: [{ model: injector.models?.Patient, as: 'patient' }],
      });

      if (!contact) return;

      contact.connectionDetails = { chatId, status: 'success' };
      await contact.save();

      const contactName = contact.name;
      const patientName = [contact.patient.firstName, contact.patient.lastName].join(' ').trim();

      const successMessage = getTranslation(
        'telegramRegistration.successMessage',
        `Dear :contactName, you have successfully registered to receive messages for :patientName. Thank you.`,
        { contactName, patientName },
      );

      client.emit('telegram:send-message', { chatId, message: successMessage });
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

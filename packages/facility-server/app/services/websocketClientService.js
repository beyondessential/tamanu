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
    async ({ chatId, contactId, botInfo }) => {
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
        `Dear :contactName, you have successfully registered to receive messages for :patientName from :botName. Thank you.
        \nIf you would prefer to not receive future messages from :botName, please select :command`,
        { contactName, patientName, botName: botInfo.first_name, command: '/unsubscribe' },
      );

      client.emit('telegram:send-message', { chatId, message: successMessage });
      injector.websocketService.emit('telegram:subscribe:success', { contactId });
    },
  );

  client.on(
    'telegram:unsubscribe',
    /**
     *
     * @param {{ contactId: string, chatId: string  }} payload
     */
    async ({ chatId, contactId, botInfo }) => {
      const getTranslation = await injector.models?.TranslatedString.getTranslationFunction(
        injector.config.language,
        ['telegramDeregistration'],
      );

      const handleNoResults = () => {
        const sendMessage = getTranslation(
          'telegramDeregistration.alreadyUnsubscribed',
          'You are already unsubscribed',
        );
        client.emit('telegram:send-message', { chatId, message: sendMessage });
      };

      const handleRemoveContact = async contact => {
        await contact.destroy();

        const contactName = contact.name;
        const patientName = [contact.patient.firstName, contact.patient.lastName].join(' ').trim();

        const successMessage = getTranslation(
          'telegramDeregistration.successMessage',
          `Dear :contactName, you have successfully deregistered from receiving messages for :patientName from :botName. Thank you.`,
          { contactName, patientName, botName: botInfo.first_name },
        );

        client.emit('telegram:send-message', { chatId, message: successMessage });
        injector.websocketService.emit('telegram:unsubscribe:success', { contactId });
      };

      if (!contactId) {
        const contacts = await injector.models?.PatientContact.findAll({
          where: { 'connectionDetails.chatId': chatId },
          include: [{ model: injector.models?.Patient, as: 'patient' }],
        });

        if (!contacts?.length) {
          handleNoResults();
          return;
        }

        if (contacts.length === 1) {
          await handleRemoveContact(contacts[0]);
          return;
        }

        const patientList = contacts.map(contact => [
          {
            text: [contact.patient.firstName, contact.patient.lastName].join(' ').trim(),
            callback_data: `unsubscribe-contact|${contact.id}`,
          },
        ]);

        const sendMessage = getTranslation(
          'telegramDeregistration.selectPatientToDeregister',
          'Please select the patient you would like to deregister from receiving messages.',
        );

        client.emit('telegram:send-message', {
          chatId,
          message: sendMessage,
          options: {
            reply_markup: {
              inline_keyboard: patientList,
            },
          },
        });

        return;
      }

      const contact = await injector.models?.PatientContact.findByPk(contactId, {
        include: [{ model: injector.models?.Patient, as: 'patient' }],
      });

      if (!contact) {
        handleNoResults();
        return;
      }

      await handleRemoveContact(contact);
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

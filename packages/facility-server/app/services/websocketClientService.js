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
      const contact = await injector.models?.PatientContact.findOne({
        where: { id: contactId },
        include: [{ model: injector.models?.Patient, as: 'patient' }],
      });

      if (!contact) {
        const sendMessage = `No patient found`; //TODO: translate this
        client.emit('telegram:send-message', { chatId, message: sendMessage });
        return;
      }

      contact.connectionDetails = { chatId, status: 'success' };
      await contact.save();

      const contactName = contact.name;
      const patientName = [
        contact.patient.firstName,
        contact.patient.middleName,
        contact.patient.lastName,
      ].join(' ');

      const successMessage = `Dear ${contactName}, you have successfully registered to receive messages for ${patientName}. Thank you.`; //TODO: translate this

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
    async ({ chatId, contactId }) => {
      //TODO: break it down to smaller functions

      //List all patients for this contact if no contact id is provided
      if (!contactId) {
        const contacts = await injector.models?.PatientContact.findAll({
          where: { 'connectionDetails.chatId': chatId },
          include: [{ model: injector.models?.Patient, as: 'patient' }],
        });

        if (!contacts?.length) {
          const sendMessage = `No patients found`; //TODO: translate this
          client.emit('telegram:send-message', { chatId, message: sendMessage });
          return;
        }

        const listPatients = contacts.map(contact => ({
          text: [
            contact.patient.firstName,
            contact.patient.middleName,
            contact.patient.lastName,
          ].join(' '),
          callback_data: JSON.stringify({ type: 'unsubscribe-contact', contactId: contact.id }),
        }));

        const listPatientMessage = `Please select the patient you would like to deregister from receiving messages.`; //TODO: translate this
        client.emit('telegram:send-message', {
          chatId,
          message: listPatientMessage,
          options: { reply_markup: { inline_keyboard: [listPatients] } },
        });

        return;
      } else {
        const contact = await injector.models?.PatientContact.findByPk(contactId, {
          include: [{ model: injector.models?.Patient, as: 'patient' }],
        });

        if (!contact) return;

        await contact.destroy();

        const contactName = contact.name;
        const patientName = [
          contact.patient.firstName,
          contact.patient.middleName,
          contact.patient.lastName,
        ].join(' ');

        const successMessage = `Dear ${contactName}, you have successfully deregistered from receiving messages for ${patientName}. Thank you`; //TODO: translate this

        client.emit('telegram:send-message', { chatId, message: successMessage });
        injector.websocketService.emit('telegram:unsubscribe:success', { contactId });
      }
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

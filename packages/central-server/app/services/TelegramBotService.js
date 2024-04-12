import TelegramBot from 'node-telegram-bot-api';
import { COMMUNICATION_STATUSES } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
/**
 * @typedef {import("../../../shared/src/models/index.js")} Models
 */

/**
 *
 * @param {{ apiToken: string, models: Models, language: string, webhook: { url: string, secret: string}}} injector
 */
export const defineTelegramBotService = async injector => {
  //fallback to polling if webhook url is not set
  const bot = new TelegramBot(injector.apiToken, { polling: !injector.webhook.url });
  const botUser = await bot.getMe().catch(() => null); // preventing error on startup
  const translate = injector.models.TranslatedString.getTranslationFunction(injector.language);

  /**
   *
   * @param {TelegramBot.Update} update
   */
  const update = update => {
    bot.processUpdate(update);
  };
  /**
   *
   * @param {{url: string, secret: string}} hook
   * @returns
   */
  const setWebhook = async hook => {
    try {
      await bot.setWebHook(hook.url, { secret_token: hook.secret });
    } catch (e) {
      log.error('set telegram webhook failed', { url: hook.url, error: e.message });
    }
  };

  /**
   *
   * @param {string} command
   * @param {(msg: TelegramBot.Message, match?: string) => void } handler
   */
  const setCommand = (command, handler) => {
    bot.onText(new RegExp(`^\\/${command}\\s*([A-z0-9\\-]*)$`), (message, match) =>
      handler(message, match.at(1)),
    );
  };

  /**
   * @param {string} chatId
   * @param {string} message
   *  */
  const sendMessage = async (chatId, textMsg) => {
    try {
      const message = await bot.sendMessage(chatId, textMsg);
      return { status: COMMUNICATION_STATUSES.SENT, result: message };
    } catch (e) {
      return { status: COMMUNICATION_STATUSES.ERROR, error: e.message, shouldRetry: true };
    }
  };

  /**
   * Register a new contact and send a success message.
   *
   * @param {TelegramBot.Message} message - the message object containing contact information
   * @param {string} contactId
   */
  const subscribeCommandHandler = async (message, contactId) => {
    const chatId = message.chat.id;
    const botName = [botUser?.first_name, botUser?.last_name].join(' ');
    const contact = await injector.models.PatientContact.findByPk(contactId, {
      include: [{ model: injector.models.Patient, as: 'patient' }],
    });

    if (!contact) {
      const failMessage = await translate(
        'telegramRegistration.failMessage',
        `Unable to find any contact with id ${contactId}, please try again`,
        { contactId },
      );
      await sendMessage(chatId, failMessage);
      return;
    }

    contact.connectionDetails = { chatId };
    await contact.save();

    const contactName = contact.name;
    const patientName = [
      contact.patient.firstName,
      contact.patient.middleName,
      contact.patient.lastName,
    ].join(' ');

    const successMessage = await translate(
      'telegramRegistration.successMessage',
      `Dear :contactName, you have successfully registered to receive messages for :patientName from :botName. Thank you.`,
      { contactName, botName, patientName },
    );

    await sendMessage(chatId, successMessage);
  };

  await setWebhook(injector.webhook);
  setCommand('start', subscribeCommandHandler);
  //setCommand('unsubscribe', sendMessage);

  return {
    update,
  };
};

/** @type {ReturnType<typeof defineTelegramBotService> | null} */

let singletonService = null;
/**
 *
 * @param {{ apiToken: string, models: Models, language: string, webhook: { url: string, secret: string}}} injector
 */
export const defineSingletonTelegramBotService = injector => {
  if (!singletonService) singletonService = defineTelegramBotService(injector);
  return singletonService;
};

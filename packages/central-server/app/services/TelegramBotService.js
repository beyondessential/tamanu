import { COMMUNICATION_STATUSES, WS_EVENTS } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import TelegramBot from 'node-telegram-bot-api';

/**
 *
 * @param {{ config: { telegramBot: { apiToken: string, webhook: { url: string, secret: string} }, language: string, }, models: NonNullable<import('./../ApplicationContext.js').ApplicationContext['store']>['models']}} injector
 */
export const defineTelegramBotService = async (injector) => {
  //fallback to polling if webhook url is not set
  const bot = !injector.config.telegramBot?.apiToken
    ? null
    : new TelegramBot(injector.config.telegramBot.apiToken, {
        polling: !injector.config.telegramBot?.webhook?.url,
        request: {
          agentOptions: {
            keepAlive: true,
            family: 4,
          },
        },
      });

  /** @type {ReturnType<import('./websocketService.js').defineWebsocketService>|null} */
  let websocketService = null;
  /**
   *
   * @param {ReturnType<import('./websocketService.js').defineWebsocketService>} service
   */
  const registerWebsocketService = (service) => {
    if (!websocketService) websocketService = service;
  };

  /**
   *
   * @param {TelegramBot.Update} update
   */
  const update = (update) => {
    if (!bot) return;
    bot.processUpdate(update);
  };
  /**
   *
   * @param {{url: string, secret: string}} hook
   * @returns
   */
  const setWebhook = async (hook) => {
    try {
      await bot
        .setWebHook(hook.url, { secret_token: hook.secret })
        .then((result) => log.info('set telegram webhook successfully', { result }));
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
   * @param {options?: TelegramBot.SendMessageOptions} options
   *  */
  const sendMessage = async (chatId, textMsg, options) => {
    if (!bot) return;
    try {
      const message = await bot.sendMessage(chatId, textMsg, options);
      return { status: COMMUNICATION_STATUSES.SENT, result: message };
    } catch (e) {
      return { status: COMMUNICATION_STATUSES.ERROR, error: e.message, shouldRetry: true };
    }
  };

  const getBotInfo = async () => {
    if (!bot) return {};
    return await bot.getMe();
  };

  /**
   * Register a new contact and send a success message.
   *
   * @param {TelegramBot.Message} message - the message object containing contact information
   * @param {string} contactId
   */
  const subscribeCommandHandler = async (message, contactId) => {
    const contact = await injector.models?.PatientContact?.findByPk(contactId, {
      include: [{ model: injector.models?.Patient, as: 'patient' }],
    });
    const getTranslation = await injector.models?.TranslatedString?.getTranslationFunction(
      injector.config.language,
      ['telegramRegistration'],
    );

    if (!contact) {
      const notFoundMessage = getTranslation(
        'telegramRegistration.contactNotFound',
        'Contact not found',
      );
      await sendMessage(message.chat.id, notFoundMessage, { parse_mode: 'HTML' });
      return;
    }
    contact.connectionDetails = { chatId: message.chat.id };
    await contact.save();

    const botInfo = await getBotInfo();
    const contactName = contact.name;
    const patientName = [contact.patient.firstName, contact.patient.lastName].join(' ').trim();

    const successMessage = getTranslation(
      'telegramRegistration.successMessage',
      `Dear <strong>:contactName</strong>, you have successfully registered to receive messages for <strong>:patientName</strong> from <strong>:botName</strong>. Thank you.
      \nIf you would prefer to not receive future messages from <strong>:botName</strong>, please select :command`,
      {
        replacements: {
          contactName,
          patientName,
          botName: botInfo.first_name,
          command: '/unsubscribe',
        },
      },
    );

    await sendMessage(message.chat.id, successMessage, { parse_mode: 'HTML' });
    websocketService?.emit(WS_EVENTS.TELEGRAM_SUBSCRIBE, { contactId, chatId: message.chat.id });
  };

  /**
   *
   * @param {TelegramBot.Message} message - the message object containing contact information
   * @param {string} contactId
   */
  const unsubscribeCommandHandler = async (message, contactId) => {
    const chatId = message.chat.id;

    const getTranslation = await injector.models?.TranslatedString.getTranslationFunction(
      injector.config.language,
      ['telegramDeregistration'],
    );

    const handleNoResults = () => {
      const message = getTranslation(
        'telegramDeregistration.alreadyUnsubscribed',
        'You are already unsubscribed',
      );
      sendMessage(chatId, message);
    };

    const handleRemoveContact = async (contact) => {
      const botInfo = await getBotInfo();

      const contactName = contact.name;
      const patientName = [contact.patient.firstName, contact.patient.lastName].join(' ').trim();

      await injector.models.PatientContact.destroy({ where: { id: contact.id } });
      const successMessage = getTranslation(
        'telegramDeregistration.successMessage',
        `Dear <strong>:contactName</strong>, you have successfully deregistered from receiving messages for <strong>:patientName</strong> from <strong>:botName</strong>. Thank you.`,
        { replacements: { contactName, patientName, botName: botInfo.first_name } },
      );

      sendMessage(chatId, successMessage, { parse_mode: 'HTML' });
      websocketService.emit(WS_EVENTS.TELEGRAM_UNSUBSCRIBE, { contactId: contact.id });
    };

    if (!contactId) {
      const contacts = await injector.models?.PatientContact?.findAll({
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

      const patientList = contacts.map((contact) => [
        {
          text: [contact.patient.firstName, contact.patient.lastName].join(' ').trim(),
          callback_data: `unsubscribe-contact|${contact.id}`,
        },
      ]);

      const message = getTranslation(
        'telegramDeregistration.selectPatientToDeregister',
        'Please select the patient you would like to deregister from receiving messages.',
      );

      sendMessage(chatId, message, {
        reply_markup: {
          inline_keyboard: patientList,
        },
      });

      return;
    }

    const contact = await injector.models?.PatientContact?.findByPk(contactId, {
      include: [{ model: injector.models?.Patient, as: 'patient' }],
    });

    if (!contact) {
      handleNoResults();
      return;
    }

    await handleRemoveContact(contact);
  };

  if (bot) {
    await setWebhook(injector.config.telegramBot.webhook);
    setCommand('start', subscribeCommandHandler);
    setCommand('unsubscribe', unsubscribeCommandHandler);

    bot.on('callback_query', async (query) => {
      try {
        const data = query.data?.split('|') || [];
        if (data[0] === 'unsubscribe-contact') {
          await unsubscribeCommandHandler(query.message, data[1]);
        }
        // eslint-disable-next-line no-empty
      } catch (e) {
        log.error('telegram callback query failed', { error: e.message });
      } finally {
        bot.answerCallbackQuery({ callback_query_id: query.id });
      }
    });
  }

  return {
    update,
    sendMessage,
    registerWebsocketService, //TODO: This is just a hack to make it work. will have to restructure the codebase for a better workflow
    getBotInfo,
  };
};

/** @type {ReturnType<typeof defineTelegramBotService> | null} */

let singletonService = null;
/**
 *
 * @param {{ config: { telegramBot: { apiToken: string, webhook: { url: string, secret: string} }, language: string, }}} injector
 */
export const defineSingletonTelegramBotService = (injector) => {
  if (!singletonService) singletonService = defineTelegramBotService(injector);
  return singletonService;
};

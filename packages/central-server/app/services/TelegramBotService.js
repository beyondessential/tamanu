import TelegramBot from 'node-telegram-bot-api';
import { COMMUNICATION_STATUSES } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';

/**
 *
 * @param {{ config: { telegramBot: { apiToken: string, webhook: { url: string, secret: string} }, language: string, }}} injector
 */
export const defineTelegramBotService = async injector => {
  //fallback to polling if webhook url is not set
  const bot = new TelegramBot(injector.config.telegramBot.apiToken, {
    polling: !injector.config.telegramBot.webhook.url,
  });

  /** @type {ReturnType<import('./websocketService.js').defineWebsocketService>|null} */
  let websocketService = null;
  /**
   *
   * @param {ReturnType<import('./websocketService.js').defineWebsocketService>} service
   */
  const registerWebsocketService = service => {
    if (!websocketService) websocketService = service;
  };

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
   * @param {options?: TelegramBot.SendMessageOptions} options
   *  */
  const sendMessage = async (chatId, textMsg, options) => {
    try {
      const message = await bot.sendMessage(chatId, textMsg, options);
      return { status: COMMUNICATION_STATUSES.SENT, result: message };
    } catch (e) {
      return { status: COMMUNICATION_STATUSES.ERROR, error: e.message, shouldRetry: true };
    }
  };

  const getBotInfo = async () => {
    return await bot.getMe();
  };

  /**
   * Register a new contact and send a success message.
   *
   * @param {TelegramBot.Message} message - the message object containing contact information
   * @param {string} contactId
   */
  const subscribeCommandHandler = async (message, contactId) => {
    const botInfo = await getBotInfo();
    websocketService.emit('telegram:subscribe', { contactId, chatId: message.chat.id, botInfo });
  };

  await setWebhook(injector.config.telegramBot.webhook);
  setCommand('start', subscribeCommandHandler);
  //setCommand('unsubscribe', sendMessage);

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
export const defineSingletonTelegramBotService = injector => {
  if (!singletonService) singletonService = defineTelegramBotService(injector);
  return singletonService;
};

import { registerTelegramSendMessageEvent } from './telegramSendMessage';

/**
 *
 * @param {{ websocketService: ReturnType<import('../services/websocketService').defineWebsocketService>, telegramBotService: ReturnType<import('../services/TelegramBotService').defineTelegramBotService>}} injector
 */
export const registerWebsocketEvents = injector => {
  registerTelegramSendMessageEvent(injector);
};

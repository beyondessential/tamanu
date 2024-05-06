import { WS_EVENTS } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';

/**
 *
 * @param {{ websocketService: ReturnType<import('../services/websocketService').defineWebsocketService>, telegramBotService: Awaited<ReturnType<import('../services/TelegramBotService').defineTelegramBotService>>}} injector
 */
export const registerTelegramGetBotInfoEvent = injector => {
  injector.websocketService.registerEvent(WS_EVENTS.TELEGRAM_GET_BOT_INFO, async () => {
    const result = await injector.telegramBotService.getBotInfo().catch(e => {
      log.error('Error getting bot info', e);
      return null;
    });
    injector.websocketService.emit(WS_EVENTS.TELEGRAM_BOT_INFO, result);
  });
};

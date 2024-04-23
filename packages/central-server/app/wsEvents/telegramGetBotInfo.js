import { WS_EVENTS } from '@tamanu/constants';

/**
 *
 * @param {{ websocketService: ReturnType<import('../services/websocketService').defineWebsocketService>, telegramBotService: Awaited<ReturnType<import('../services/TelegramBotService').defineTelegramBotService>>}} injector
 */
export const registerTelegramGetBotInfoEvent = injector => {
  injector.websocketService.registerEvent(WS_EVENTS.TELEGRAM_BOT_INFO, async () => {
    injector.websocketService.emit(
      WS_EVENTS.TELEGRAM_BOT_INFO,
      await injector.telegramBotService.getBotInfo(),
    );
  });
};

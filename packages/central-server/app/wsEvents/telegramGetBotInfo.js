/**
 *
 * @param {{ websocketService: ReturnType<import('../services/websocketService').defineWebsocketService>, telegramBotService: Awaited<ReturnType<import('../services/TelegramBotService').defineTelegramBotService>>}} injector
 */
export const registerTelegramGetBotInfoEvent = injector => {
  injector.websocketService.registerEvent('telegram:get-bot-info', async () => {
    injector.websocketService.emit(
      'telegram:bot-info',
      await injector.telegramBotService.getBotInfo(),
    );
  });
};

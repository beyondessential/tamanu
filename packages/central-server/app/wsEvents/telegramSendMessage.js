/**
 *
 * @param {{ websocketService: ReturnType<import('../services/websocketService').defineWebsocketService>, telegramBotService: ReturnType<import('../services/TelegramBotService').defineTelegramBotService>}} injector
 */
export const registerTelegramSendMessageEvent = injector => {
  injector.websocketService.registerEvent(
    'telegram:send-message',
    /**
     *
     * @param {{chatId: string, message: string}} payload
     */
    async ({ chatId, message }) => {
      await injector.telegramBotService.sendMessage(chatId, message);
    },
  );
};

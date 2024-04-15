/**
 *
 * @param {{ websocketService: ReturnType<import('../services/websocketService').defineWebsocketService>, telegramBotService: Awaited<ReturnType<import('../services/TelegramBotService').defineTelegramBotService>>}} injector
 */
export const registerTelegramSendMessageEvent = injector => {
  injector.websocketService.registerEvent(
    'telegram:send-message',
    /**
     *
     * @param {{chatId: string, message: string, options?: TelegramBot.SendMessageOptions }} payload
     */
    async ({ chatId, message, options }) => {
      await injector.telegramBotService.sendMessage(chatId, message, options);
    },
  );
};

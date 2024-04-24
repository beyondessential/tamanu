import { registerPatientContactInsert } from './patientContactInsert';
import { registerTelegramGetBotInfoEvent } from './telegramGetBotInfo';
import { registerTelegramSendMessageEvent } from './telegramSendMessage';

/**
 *@typedef {import('@tamanu/shared/models')} Models
 * @param {{ websocketService: ReturnType<import('../services/websocketService').defineWebsocketService>, telegramBotService: ReturnType<import('../services/TelegramBotService').defineTelegramBotService>, models: Models}} injector
 */
export const registerWebsocketEvents = injector => {
  registerTelegramSendMessageEvent(injector);
  registerTelegramGetBotInfoEvent(injector);
  registerPatientContactInsert(injector);
};

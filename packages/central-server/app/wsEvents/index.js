import { registerPatientContactInsert } from './patientContactInsert';
import { registerTelegramGetBotInfoEvent } from './telegramGetBotInfo';

/**
 * @typedef {import('@tamanu/database/models')} Models
 * @param {{ websocketService: ReturnType<import('../services/websocketService').defineWebsocketService>, telegramBotService: ReturnType<import('../services/TelegramBotService').defineTelegramBotService>, models: Models}} injector
 */
export const registerWebsocketEvents = injector => {
  registerTelegramGetBotInfoEvent(injector);
  registerPatientContactInsert(injector);
};

import { registerPatientContactInsert } from './patientContactInsert';
import { registerTelegramGetBotInfoEvent } from './telegramGetBotInfo';
import { registerDataChanged } from './dataChanged';
/**
 *@typedef {import('@tamanu/shared/models')} Models
 * @param {{ websocketService: ReturnType<import('../services/websocketService').defineWebsocketService>, telegramBotService: ReturnType<import('../services/TelegramBotService').defineTelegramBotService>, models: Models}} injector
 */
export const registerWebsocketEvents = injector => {
  registerTelegramGetBotInfoEvent(injector);
  registerPatientContactInsert(injector);
  registerDataChanged(injector);
};

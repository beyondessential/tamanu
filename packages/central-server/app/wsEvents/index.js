import { registerPatientContactInsert } from './patientContactInsert';

/**
 * @typedef {import('@tamanu/database/models')} Models
 * @param {{ websocketService: ReturnType<import('../services/websocketService').defineWebsocketService>, models: Models}} injector
 */
export const registerWebsocketEvents = injector => {
  registerPatientContactInsert(injector);
};

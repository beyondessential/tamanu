import { WS_EVENTS } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';

/**
 * @typedef {import('@tamanu/shared/models')} Models
 * @param {{ websocketService: ReturnType<import('../services/websocketService').defineWebsocketService>, models: Models}} injector
 */
export const registerDataChanged = injector => {
  injector.websocketService.registerEvent(
    WS_EVENTS.DATABASE_TABLE_CHANGED,
    /**
     *
     * @param {Models.PatientContact} patient
     */
    async data => {
      console.log('dataaaaaa', data);
    },
  );
};

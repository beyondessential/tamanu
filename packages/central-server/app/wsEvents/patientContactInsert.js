import { WS_EVENTS } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';

/**
 * @typedef {import('@tamanu/database/models')} Models
 * @param {{ websocketService: ReturnType<import('../services/websocketService').defineWebsocketService>, models: Models}} injector
 */
export const registerPatientContactInsert = injector => {
  injector.websocketService.registerEvent(
    WS_EVENTS.PATIENT_CONTACT_INSERT,
    /**
     *
     * @param {Models.PatientContact} patient
     */
    async patient => {
      try {
        await injector.models.PatientContact.create(patient);
      } catch (e) {
        log.error('Error inserting patient contact', e);
      }
    },
  );
};

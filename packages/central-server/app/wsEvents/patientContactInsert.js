import { WS_EVENTS } from '@tamanu/constants';

/**
 * @typedef {import('@tamanu/shared/models')} Models
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
      await injector.models.PatientContact.create(patient);
    },
  );
};

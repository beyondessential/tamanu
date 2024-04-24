/**
 * @typedef {import('@tamanu/shared/models')} Models
 * @param {{ websocketService: ReturnType<import('../services/websocketService').defineWebsocketService>, models: Models}} injector
 */
export const registerPatientContactInsert = injector => {
  injector.websocketService.registerEvent(
    'patient-contact:insert',
    /**
     *
     * @param {Models.PatientContact} patient
     */
    async patient => {
      await injector.models.PatientContact.create(patient);
    },
  );
};

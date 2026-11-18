import { subject } from '@casl/ability';
import { z } from 'zod';

import { PATIENT_COMMUNICATION_CHANNELS, WS_EVENTS } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { getAbilityForUser } from '@tamanu/shared/permissions/rolesToPermissions';

// Connection details are set when the contact registers with the messaging service, never by the
// client that adds the contact.
const patientContactInsertPayload = z.object({
  id: z.string().min(1),
  patientId: z.string().min(1),
  relationshipId: z.string().min(1),
  name: z.string().min(1),
  method: z.enum(Object.values(PATIENT_COMMUNICATION_CHANNELS)),
});

/**
 * @typedef {import('@tamanu/database/models')} Models
 * @param {{ websocketService: ReturnType<import('../services/websocketService').defineWebsocketService>, models: Models}} injector
 */
export const registerPatientContactInsert = injector => {
  injector.websocketService.registerEvent(
    WS_EVENTS.PATIENT_CONTACT_INSERT,
    /**
     * @param {import('socket.io').Socket} socket
     * @param {unknown} payload
     */
    async (socket, payload) => {
      try {
        const contact = patientContactInsertPayload.parse(payload);

        const { user, impersonateRoleId } = socket.data;
        const ability = await getAbilityForUser(injector.models, user, { impersonateRoleId });
        if (!ability.can('write', subject('Patient', { id: contact.patientId }))) {
          log.warn('Patient contact insert refused: user may not write to this patient', {
            userId: user.id,
          });
          return;
        }

        await injector.models.PatientContact.create(contact);
      } catch (e) {
        log.error('Error inserting patient contact', e);
      }
    },
  );
};

import { subject } from '@casl/ability';
import { z } from 'zod';

import { DEVICE_SCOPES, PATIENT_COMMUNICATION_CHANNELS, WS_EVENTS } from '@tamanu/constants';
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

// A sync client can already push patient contacts through sync, so its device scope is enough.
// This is how a facility server relays the contacts its own users add.
const mayWritePatient = async (models, { user, device, impersonateRoleId }, patientId) => {
  if (device?.scopes.includes(DEVICE_SCOPES.SYNC_CLIENT)) return true;
  const ability = await getAbilityForUser(models, user, { impersonateRoleId });
  return ability.can('write', subject('Patient', { id: patientId }));
};

const insertPatientContact = async (models, socketData, payload) => {
  try {
    const contact = patientContactInsertPayload.parse(payload);

    const { user } = socketData;
    if (!(await mayWritePatient(models, socketData, contact.patientId))) {
      log.warn('Patient contact insert refused: user may not write to this patient', {
        userId: user.id,
      });
      return false;
    }

    await models.PatientContact.create(contact);
    return true;
  } catch (e) {
    log.error('Error inserting patient contact', e);
    return false;
  }
};

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
     * @param {unknown} acknowledge called with whether the contact was stored, when the client asks
     */
    async (socket, payload, acknowledge) => {
      const stored = await insertPatientContact(injector.models, socket.data, payload);
      if (typeof acknowledge === 'function') acknowledge({ stored });
    },
  );
};

import { subject } from '@casl/ability';
import { z } from 'zod';

import {
  DEVICE_SCOPES,
  PATIENT_COMMUNICATION_CHANNELS,
  USER_KINDS,
  WS_EVENTS,
} from '@tamanu/constants';
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

// A facility server relays the contacts its own users add, signed in as its sync account. Mobile
// devices sync too, so the device scope alone does not identify a facility server.
const isFacilitySyncAccount = ({ user, device }) =>
  user.kind === USER_KINDS.SYNC && Boolean(device?.scopes.includes(DEVICE_SCOPES.SYNC_CLIENT));

const mayWritePatient = async (models, socketData, patientId) => {
  if (isFacilitySyncAccount(socketData)) return true;
  const { user, impersonateRoleId } = socketData;
  const ability = await getAbilityForUser(models, user, { impersonateRoleId });
  return ability.can('write', subject('Patient', { id: patientId }));
};

const insertPatientContact = async (models, socketData, payload) => {
  const { user } = socketData;
  const parsed = patientContactInsertPayload.safeParse(payload);
  if (!parsed.success) {
    log.warn('Patient contact insert refused: invalid payload', {
      userId: user.id,
      fields: parsed.error.issues.map(issue => issue.path.join('.')),
    });
    return false;
  }

  const contact = parsed.data;
  try {
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

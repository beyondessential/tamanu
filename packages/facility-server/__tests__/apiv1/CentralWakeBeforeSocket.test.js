import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { REFERENCE_TYPES, WS_EVENTS } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';

import { createTestContext } from '../utilities';

// Records the order of the HTTP request to central and the socket messages that follow it
const calls = vi.hoisted(() => ({
  log: [],
  // Lets a test hold the wake open
  wakeGate: null,
}));

vi.mock('../../app/utils/wakeCentral', () => ({
  wakeCentral: vi.fn(async () => {
    await calls.wakeGate;
    calls.log.push('wake');
  }),
}));

vi.mock('../../app/services/websocketClientService', () => ({
  defineWebsocketClientService: () => ({
    getClient: () => null,
    emit: (eventName, ...args) => calls.log.push(['emit', eventName, ...args]),
    listenOnce: () => {},
    removeListener: () => {},
  }),
}));

describe('waking central before a socket message', () => {
  let baseApp;
  let models;
  let ctx;

  disableHardcodedPermissionsForSuite();

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
  });
  afterAll(() => ctx.close());

  beforeEach(() => {
    calls.log.length = 0;
    calls.wakeGate = null;
  });

  it('makes a request to central before emitting a patient contact insert', async () => {
    const patient = await models.Patient.create(fake(models.Patient));
    const relationship = await models.ReferenceData.create(
      fake(models.ReferenceData, { type: REFERENCE_TYPES.CONTACT_RELATIONSHIP }),
    );
    const app = await baseApp.asNewRole([
      ['read', 'Patient'],
      ['write', 'Patient'],
    ]);

    const result = await app
      .post('/api/patient/reminderContact')
      .send(
        fake(models.PatientContact, { patientId: patient.id, relationshipId: relationship.id }),
      );

    expect(result).toHaveSucceeded();
    await vi.waitFor(() => expect(calls.log).toHaveLength(2));
    expect(calls.log[0]).toBe('wake');
    expect(calls.log[1]).toEqual([
      'emit',
      WS_EVENTS.PATIENT_CONTACT_INSERT,
      expect.objectContaining({ id: result.body.id }),
    ]);
  });

  it('still emits a patient contact insert when the wake takes a while', async () => {
    const patient = await models.Patient.create(fake(models.Patient));
    const relationship = await models.ReferenceData.create(
      fake(models.ReferenceData, { type: REFERENCE_TYPES.CONTACT_RELATIONSHIP }),
    );
    const app = await baseApp.asNewRole([
      ['read', 'Patient'],
      ['write', 'Patient'],
    ]);
    let releaseWake;
    calls.wakeGate = new Promise(resolve => {
      releaseWake = resolve;
    });

    const result = await app
      .post('/api/patient/reminderContact')
      .send(
        fake(models.PatientContact, { patientId: patient.id, relationshipId: relationship.id }),
      );

    expect(result).toHaveSucceeded();
    expect(calls.log).toEqual([]);

    releaseWake();
    await vi.waitFor(() => expect(calls.log).toHaveLength(2));
    expect(calls.log[0]).toBe('wake');
    expect(calls.log[1][1]).toBe(WS_EVENTS.PATIENT_CONTACT_INSERT);
  });

  it('rejects a patient contact insert from a role that cannot write patients', async () => {
    const app = await baseApp.asNewRole([['read', 'Patient']]);

    const result = await app.post('/api/patient/reminderContact').send({});

    expect(result).toBeForbidden();
    expect(calls.log).toEqual([]);
  });

  it('rejects an unauthenticated patient contact insert', async () => {
    const result = await baseApp.post('/api/patient/reminderContact').send({});

    expect(result).toHaveRequestError();
    expect(calls.log).toEqual([]);
  });
});

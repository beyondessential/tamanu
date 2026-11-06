import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { REFERENCE_TYPES, WS_EVENTS } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';

import { createTestContext } from '../utilities';
import {
  getTelegramBotInfo,
  TELEGRAM_BOT_INFO_TIMEOUT_MS,
} from '../../app/routes/apiv1/telegram/telegramRoutes';

// Records the order of the HTTP request to central and the socket messages that follow it
const calls = vi.hoisted(() => ({
  log: [],
  botInfoListeners: [],
  // Lets a test hold the wake open, and stop central answering the bot information request
  wakeGate: null,
  isCentralAnswering: true,
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
    emit: (eventName, ...args) => {
      calls.log.push(['emit', eventName, ...args]);
      if (eventName === 'telegram:get-bot-info' && calls.isCentralAnswering) {
        calls.botInfoListeners.splice(0).forEach(listener => listener({ username: 'test_bot' }));
      }
    },
    listenOnce: (_eventName, callback) => calls.botInfoListeners.push(callback),
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
    calls.botInfoListeners.length = 0;
    calls.wakeGate = null;
    calls.isCentralAnswering = true;
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

  it('rejects an unauthenticated patient contact insert', async () => {
    const result = await baseApp.post('/api/patient/reminderContact').send({});

    expect(result).toHaveRequestError();
    expect(calls.log).toEqual([]);
  });

  it('makes a request to central before asking for the Telegram bot information', async () => {
    const app = await baseApp.asRole('practitioner');

    const result = await app.get('/api/telegram/bot-info');

    expect(result).toHaveSucceeded();
    expect(result.body).toEqual({ username: 'test_bot' });
    expect(calls.log).toEqual(['wake', ['emit', WS_EVENTS.TELEGRAM_GET_BOT_INFO]]);
  });

  it('answers with an error when central does not send the Telegram bot information', async () => {
    const app = await baseApp.asRole('practitioner');
    calls.isCentralAnswering = false;
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

    try {
      const request = app.get('/api/telegram/bot-info').then(response => response);
      await vi.waitFor(() => expect(calls.botInfoListeners).toHaveLength(1));
      await vi.advanceTimersByTimeAsync(TELEGRAM_BOT_INFO_TIMEOUT_MS);

      expect(await request).toHaveStatus(500);
    } finally {
      vi.useRealTimers();
    }
  });

  it('rejects an unauthenticated request for the Telegram bot information', async () => {
    const result = await baseApp.get('/api/telegram/bot-info');

    expect(result).toHaveRequestError();
    expect(calls.log).toEqual([]);
  });
});

describe('getTelegramBotInfo', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('errors and stops listening when central does not answer in time', async () => {
    const ws = { emit: vi.fn(), listenOnce: vi.fn(), removeListener: vi.fn() };

    const result = getTelegramBotInfo(ws);
    const expectation = expect(result).rejects.toThrow(/Timed out/);
    await vi.advanceTimersByTimeAsync(TELEGRAM_BOT_INFO_TIMEOUT_MS);

    await expectation;
    expect(ws.removeListener).toHaveBeenCalledWith(
      WS_EVENTS.TELEGRAM_BOT_INFO,
      ws.listenOnce.mock.calls[0][1],
    );
  });

  it('resolves with the bot information and cancels the timeout', async () => {
    const ws = {
      emit: vi.fn(),
      listenOnce: vi.fn((_eventName, callback) => callback({ username: 'test_bot' })),
      removeListener: vi.fn(),
    };

    await expect(getTelegramBotInfo(ws)).resolves.toEqual({ username: 'test_bot' });
    expect(vi.getTimerCount()).toBe(0);
  });
});

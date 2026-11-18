import config from 'config';
import { io } from 'socket.io-client';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  JWT_TOKEN_TYPES,
  PATIENT_COMMUNICATION_CHANNELS,
  REFERENCE_TYPES,
  WS_EVENTS,
  WS_PATH,
} from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

import { buildToken } from '../app/auth/utils';
import { createTestContext } from './utilities';

describe('Websocket', () => {
  let ctx;
  let models;
  let url;
  const sockets = [];

  const buildAccessToken = (user, expiresIn = '1d') =>
    buildToken({ userId: user.id }, config.auth.secret, {
      expiresIn,
      audience: JWT_TOKEN_TYPES.ACCESS,
      issuer: config.canonicalHostName,
    });

  const connect = auth => {
    const socket = io(url, { path: WS_PATH, transports: ['websocket'], reconnection: false, auth });
    sockets.push(socket);
    return socket;
  };

  const connectAs = async user => {
    const socket = connect({ token: await buildAccessToken(user) });
    await new Promise((resolve, reject) => {
      socket.once('connect', resolve);
      socket.once('connect_error', reject);
    });
    return socket;
  };

  const connectionError = socket =>
    new Promise(resolve => {
      socket.once('connect', () => resolve(null));
      socket.once('connect_error', error => resolve(error.message));
    });

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    await new Promise(resolve => {
      ctx.appServer.listen(0, '127.0.0.1', resolve);
    });
    url = `http://127.0.0.1:${ctx.appServer.address().port}`;
  });

  afterEach(() => {
    sockets.splice(0).forEach(socket => socket.disconnect());
  });

  afterAll(() => ctx.close());

  describe('connecting', () => {
    it('refuses a connection with no token', async () => {
      expect(await connectionError(connect({}))).toBe('Unauthorised');
    });

    it('refuses a connection with a token that is not valid', async () => {
      expect(await connectionError(connect({ token: 'not-a-token' }))).toBe('Unauthorised');
    });

    it('refuses a connection with an expired token', async () => {
      const user = await models.User.create(fake(models.User));
      const token = await buildAccessToken(user, '-1h');
      expect(await connectionError(connect({ token }))).toBe('Unauthorised');
    });

    it('refuses a connection for a user who no longer exists', async () => {
      const token = await buildAccessToken({ id: 'no-such-user' });
      expect(await connectionError(connect({ token }))).toBe('Unauthorised');
    });

    it('accepts a connection with a valid token', async () => {
      const user = await models.User.create(fake(models.User));
      const socket = await connectAs(user);
      expect(socket.connected).toBe(true);
    });

    it('ends the connection when the token expires', async () => {
      const user = await models.User.create(fake(models.User));
      const socket = connect({ token: await buildAccessToken(user, '2s') });
      await new Promise(resolve => {
        socket.once('connect', resolve);
      });
      const reason = await new Promise(resolve => {
        socket.once('disconnect', resolve);
      });
      expect(reason).toBe('io server disconnect');
    });
  });

  describe('change notifications', () => {
    it('tells a connection that settings have changed, without the changed row', async () => {
      const user = await models.User.create(fake(models.User));
      const socket = await connectAs(user);
      const notified = new Promise(resolve => {
        socket.once(`${WS_EVENTS.DATABASE_TABLE_CHANGED}:settings`, (...args) => resolve(args));
      });

      await models.Setting.set('audit.changes.enabled', true);

      // A broadcast carries a string offset for connection state recovery, and nothing else
      expect((await notified).every(arg => typeof arg === 'string')).toBe(true);
    });
  });

  describe('patient contact insert', () => {
    const buildContactPayload = async () => {
      const patient = await models.Patient.create(fake(models.Patient));
      const relationship = await models.ReferenceData.create(
        fake(models.ReferenceData, { type: REFERENCE_TYPES.CONTACT_RELATIONSHIP }),
      );
      const contact = fake(models.PatientContact, {
        patientId: patient.id,
        relationshipId: relationship.id,
        method: PATIENT_COMMUNICATION_CHANNELS.TELEGRAM,
      });
      return { patient, contact };
    };

    const insertContact = async (user, payload) => {
      const socket = await connectAs(user);
      socket.emit(WS_EVENTS.PATIENT_CONTACT_INSERT, payload);
      // The event has no acknowledgement to wait for
      await sleepAsync(500);
    };

    it('stores the contact for a user who may write to patients', async () => {
      const { contact } = await buildContactPayload();
      const { user } = await ctx.baseApp.asNewRole([['write', 'Patient']]);

      await insertContact(user, contact);

      const stored = await models.PatientContact.findByPk(contact.id);
      expect(stored).toMatchObject({
        id: contact.id,
        patientId: contact.patientId,
        relationshipId: contact.relationshipId,
        name: contact.name,
        method: PATIENT_COMMUNICATION_CHANNELS.TELEGRAM,
      });
    });

    it('does not store connection details sent by the client', async () => {
      const { contact } = await buildContactPayload();
      const { user } = await ctx.baseApp.asNewRole([['write', 'Patient']]);

      await insertContact(user, { ...contact, connectionDetails: { chatId: '123456' } });

      const stored = await models.PatientContact.findByPk(contact.id);
      expect(stored).not.toBeNull();
      expect(stored.connectionDetails).toBeNull();
    });

    it('does not store a contact for a user who may not write to patients', async () => {
      const { contact } = await buildContactPayload();
      const { user } = await ctx.baseApp.asNewRole([['read', 'Patient']]);

      await insertContact(user, contact);

      expect(await models.PatientContact.findByPk(contact.id)).toBeNull();
    });

    it('does not store a contact with a method that is not a communication channel', async () => {
      const { contact } = await buildContactPayload();
      const { user } = await ctx.baseApp.asNewRole([['write', 'Patient']]);

      await insertContact(user, { ...contact, method: 'carrier-pigeon' });

      expect(await models.PatientContact.findByPk(contact.id)).toBeNull();
    });
  });
});

import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import config from 'config';
import { io } from 'socket.io-client';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  DEVICE_SCOPES,
  JWT_TOKEN_TYPES,
  PATIENT_COMMUNICATION_CHANNELS,
  REFERENCE_TYPES,
  USER_KINDS,
  WS_EVENTS,
  WS_PATH,
} from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { log } from '@tamanu/shared/services/logging';
import { keepSocketConnected } from '@tamanu/utils/keepSocketConnected';

import { buildToken } from '../app/auth/utils';
import { defineWebsocketService } from '../app/services/websocketService';
import { createTestContext } from './utilities';

describe('Websocket', () => {
  let ctx;
  let models;
  let url;
  const sockets = [];

  const buildAccessToken = (user, expiresIn = '1d', { deviceId } = {}) =>
    buildToken({ userId: user.id, deviceId }, config.auth.secret, {
      expiresIn,
      audience: JWT_TOKEN_TYPES.ACCESS,
      issuer: config.canonicalHostName,
    });

  const connect = auth => {
    const socket = io(url, { path: WS_PATH, transports: ['websocket'], reconnection: false, auth });
    sockets.push(socket);
    return socket;
  };

  const connectAs = async (user, { deviceId } = {}) => {
    const socket = connect({ token: await buildAccessToken(user, '1d', { deviceId }) });
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

    it('refuses a connection with a token that expired within the allowed clock skew', async () => {
      const user = await models.User.create(fake(models.User));
      const token = await buildAccessToken(user, '-3s');
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

  describe('reconnecting', () => {
    it('reconnects with refreshed credentials after a refused handshake', async () => {
      const user = await models.User.create(fake(models.User));
      let token = await buildAccessToken(user, '-1h');
      // socket.io's own reconnection left on, as the clients run it
      const socket = io(url, {
        path: WS_PATH,
        transports: ['websocket'],
        auth: sendToken => sendToken({ token }),
      });
      sockets.push(socket);
      const stop = keepSocketConnected(socket, {
        refreshCredentials: async () => {
          token = await buildAccessToken(user);
        },
      });

      try {
        expect(await connectionError(socket)).toBe('Unauthorised');
        await new Promise(resolve => {
          socket.once('connect', resolve);
        });
        expect(socket.connected).toBe(true);
      } finally {
        stop();
      }
    });
  });

  describe('event handlers', () => {
    it('logs a handler that fails and keeps serving the connection', async () => {
      const httpServer = createServer();
      await new Promise(resolve => {
        httpServer.listen(0, '127.0.0.1', resolve);
      });
      const service = await defineWebsocketService({
        httpServer,
        models,
        sequelize: ctx.store.sequelize,
      });
      service.registerEvent('test:fail', async () => {
        throw new Error('handler failed');
      });
      service.registerEvent('test:echo', (socket, value, acknowledge) => acknowledge(value));
      const errorLog = vi.spyOn(log, 'error').mockImplementation(() => {});

      try {
        const user = await models.User.create(fake(models.User));
        const socket = io(`http://127.0.0.1:${httpServer.address().port}`, {
          path: WS_PATH,
          transports: ['websocket'],
          reconnection: false,
          auth: { token: await buildAccessToken(user) },
        });
        sockets.push(socket);

        socket.emit('test:fail');
        expect(await socket.timeout(10_000).emitWithAck('test:echo', 'still here')).toBe(
          'still here',
        );
        await vi.waitFor(() =>
          expect(errorLog).toHaveBeenCalledWith('Websocket event handler failed', {
            eventName: 'test:fail',
            error: 'handler failed',
          }),
        );
      } finally {
        errorLog.mockRestore();
        await service.getSocketServer().close();
      }
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

    const insertContact = async (user, payload, { deviceId } = {}) => {
      const socket = await connectAs(user, { deviceId });
      const { stored } = await socket
        .timeout(10_000)
        .emitWithAck(WS_EVENTS.PATIENT_CONTACT_INSERT, payload);
      return stored;
    };

    it('stores the contact for a user who may write to patients', async () => {
      const { contact } = await buildContactPayload();
      const { user } = await ctx.baseApp.asNewRole([['write', 'Patient']]);

      expect(await insertContact(user, contact)).toBe(true);

      const stored = await models.PatientContact.findByPk(contact.id);
      expect(stored).toMatchObject({
        id: contact.id,
        patientId: contact.patientId,
        relationshipId: contact.relationshipId,
        name: contact.name,
        method: PATIENT_COMMUNICATION_CHANNELS.TELEGRAM,
      });
    });

    it('records the stored contact against the connected user in the changelog', async () => {
      const { contact } = await buildContactPayload();
      const { user } = await ctx.baseApp.asNewRole([['write', 'Patient']]);

      expect(await insertContact(user, contact)).toBe(true);

      const [change] = await ctx.store.sequelize.query(
        `SELECT updated_by_user_id FROM logs.changes
          WHERE table_name = 'patient_contacts' AND record_id = $recordId`,
        { bind: { recordId: contact.id }, type: ctx.store.sequelize.QueryTypes.SELECT },
      );
      expect(change).toEqual({ updated_by_user_id: user.id });
    });

    it('does not store connection details sent by the client', async () => {
      const { contact } = await buildContactPayload();
      const { user } = await ctx.baseApp.asNewRole([['write', 'Patient']]);

      expect(
        await insertContact(user, { ...contact, connectionDetails: { chatId: '123456' } }),
      ).toBe(true);

      const stored = await models.PatientContact.findByPk(contact.id);
      expect(stored).not.toBeNull();
      expect(stored.connectionDetails).toBeNull();
    });

    it('does not store a contact for a user who may not write to patients', async () => {
      const { contact } = await buildContactPayload();
      const { user } = await ctx.baseApp.asNewRole([['read', 'Patient']]);

      expect(await insertContact(user, contact)).toBe(false);
      expect(await models.PatientContact.findByPk(contact.id)).toBeNull();
    });

    const createDevice = (user, scopes) =>
      models.Device.create({ id: randomUUID(), registeredById: user.id, scopes });

    it('stores the contact sent by a sync account from a sync client device', async () => {
      const { contact } = await buildContactPayload();
      const { user } = await ctx.baseApp.asNewRole([]);
      await user.update({ kind: USER_KINDS.SYNC });
      const device = await createDevice(user, [DEVICE_SCOPES.SYNC_CLIENT]);

      expect(await insertContact(user, contact, { deviceId: device.id })).toBe(true);
      expect(await models.PatientContact.findByPk(contact.id)).not.toBeNull();
    });

    it('does not store a contact from a sync account on a device that is not a sync client', async () => {
      const { contact } = await buildContactPayload();
      const { user } = await ctx.baseApp.asNewRole([]);
      await user.update({ kind: USER_KINDS.SYNC });
      const device = await createDevice(user, []);

      expect(await insertContact(user, contact, { deviceId: device.id })).toBe(false);
      expect(await models.PatientContact.findByPk(contact.id)).toBeNull();
    });

    it('does not store a contact from a person on a sync client device who may not write to patients', async () => {
      const { contact } = await buildContactPayload();
      const { user } = await ctx.baseApp.asNewRole([['read', 'Patient']]);
      const device = await createDevice(user, [DEVICE_SCOPES.SYNC_CLIENT]);

      expect(await insertContact(user, contact, { deviceId: device.id })).toBe(false);
      expect(await models.PatientContact.findByPk(contact.id)).toBeNull();
    });

    it('does not store a contact with a method that is not a communication channel', async () => {
      const { contact } = await buildContactPayload();
      const { user } = await ctx.baseApp.asNewRole([['write', 'Patient']]);

      expect(await insertContact(user, { ...contact, method: 'carrier-pigeon' })).toBe(false);
      expect(await models.PatientContact.findByPk(contact.id)).toBeNull();
    });

    it('does not store a contact without a relationship', async () => {
      const { contact } = await buildContactPayload();
      const { user } = await ctx.baseApp.asNewRole([['write', 'Patient']]);

      expect(await insertContact(user, { ...contact, relationshipId: null })).toBe(false);
      expect(await models.PatientContact.findByPk(contact.id)).toBeNull();
    });
  });
});

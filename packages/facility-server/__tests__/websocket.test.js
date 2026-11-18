import { setTimeout as sleep } from 'node:timers/promises';
import { io } from 'socket.io-client';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { REFERENCE_TYPES, TASK_STATUSES, WS_EVENTS, WS_PATH } from '@tamanu/constants';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake } from '@tamanu/fake-data/fake';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import { buildToken } from '../app/middleware/auth';
import { createTestContext } from './utilities';

// Long enough for an event sent to every room at once to have reached every connection
const DELIVERY_GRACE_MS = 300;

describe('Websocket', () => {
  let ctx;
  let models;
  let url;
  let encounter;
  let facilityId;
  const sockets = [];

  const connect = auth => {
    const socket = io(url, { path: WS_PATH, transports: ['websocket'], reconnection: false, auth });
    sockets.push(socket);
    return socket;
  };

  /** Connects as the user, recording every event the connection receives. */
  const connectAs = async (user, { facilityId: tokenFacilityId } = {}) => {
    const token = await buildToken({ user, facilityId: tokenFacilityId, expiresIn: '1d' });
    const socket = connect({ token });
    socket.received = [];
    socket.onAny(eventName => socket.received.push(eventName));
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

  const nextEvent = (socket, eventName) =>
    new Promise(resolve => {
      socket.once(eventName, (...args) => resolve(args));
    });

  // An event sent to a room carries a string offset for connection state recovery, and nothing else
  const expectNoRecord = args => expect(args.every(arg => typeof arg === 'string')).toBe(true);

  const createUser = () => models.User.create(fake(models.User));

  const createTask = async ({ designatedUser } = {}) =>
    // One commit, so the change notification sees the task with its designation
    ctx.sequelize.transaction(async () => {
      const task = await models.Task.create({
        name: 'Check vitals',
        encounterId: encounter.id,
        status: TASK_STATUSES.TODO,
        dueTime: getCurrentDateTimeString(),
        requestTime: getCurrentDateTimeString(),
        requestedByUserId: designatedUser?.id ?? (await createUser()).id,
      });
      if (designatedUser) {
        const designation = await models.ReferenceData.create(
          fake(models.ReferenceData, { type: REFERENCE_TYPES.DESIGNATION }),
        );
        await models.UserDesignation.create({
          userId: designatedUser.id,
          designationId: designation.id,
        });
        await models.TaskDesignation.create({ taskId: task.id, designationId: designation.id });
      }
      return task;
    });

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    await new Promise(resolve => {
      ctx.appServer.listen(0, '127.0.0.1', resolve);
    });
    url = `http://127.0.0.1:${ctx.appServer.address().port}`;

    const patient = await models.Patient.create(await createDummyPatient(models));
    encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models, { current: true })),
      patientId: patient.id,
    });
    const location = await models.Location.findByPk(encounter.locationId);
    facilityId = location.facilityId;
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
      const user = await createUser();
      const token = await buildToken({ user, expiresIn: '-1h' });
      expect(await connectionError(connect({ token }))).toBe('Unauthorised');
    });

    it('accepts a connection with a valid token', async () => {
      const socket = await connectAs(await createUser());
      expect(socket.connected).toBe(true);
    });
  });

  describe('tasks', () => {
    it('tells only the designated user that a designated task changed, without the task', async () => {
      const designatedUser = await createUser();
      const designatedSocket = await connectAs(designatedUser, { facilityId });
      const otherSocket = await connectAs(await createUser(), { facilityId });
      const eventName = `${WS_EVENTS.CLINICIAN_DASHBOARD_TASKS_UPDATE}:${designatedUser.id}`;
      const notified = nextEvent(designatedSocket, eventName);

      await createTask({ designatedUser });

      expectNoRecord(await notified);
      await sleep(DELIVERY_GRACE_MS);
      expect(otherSocket.received).not.toContain(eventName);
    });

    it('tells only connections at its facility that an undesignated task changed', async () => {
      const facilitySocket = await connectAs(await createUser(), { facilityId });
      const otherSocket = await connectAs(await createUser());
      const eventName = `${WS_EVENTS.CLINICIAN_DASHBOARD_TASKS_UPDATE}:facility:${facilityId}`;
      const notified = nextEvent(facilitySocket, eventName);

      await createTask();

      expectNoRecord(await notified);
      await sleep(DELIVERY_GRACE_MS);
      expect(otherSocket.received).not.toContain(eventName);
    });

    it('does not relay the table change itself', async () => {
      const designatedUser = await createUser();
      const socket = await connectAs(designatedUser, { facilityId });
      const notified = nextEvent(
        socket,
        `${WS_EVENTS.CLINICIAN_DASHBOARD_TASKS_UPDATE}:${designatedUser.id}`,
      );

      await createTask({ designatedUser });

      await notified;
      await sleep(DELIVERY_GRACE_MS);
      expect(socket.received).not.toContain(`${WS_EVENTS.DATABASE_TABLE_CHANGED}:tasks`);
    });
  });

  describe('appointments', () => {
    it('tells only the clinician that an appointment in their schedule changed', async () => {
      const clinician = await createUser();
      const clinicianSocket = await connectAs(clinician, { facilityId });
      const otherSocket = await connectAs(await createUser(), { facilityId });
      const locationGroup = await models.LocationGroup.create(
        fake(models.LocationGroup, { facilityId }),
      );
      const eventName = `${WS_EVENTS.CLINICIAN_APPOINTMENTS_UPDATE}:${clinician.id}`;
      const notified = nextEvent(clinicianSocket, eventName);

      await models.Appointment.create(
        fake(models.Appointment, {
          patientId: encounter.patientId,
          clinicianId: clinician.id,
          locationGroupId: locationGroup.id,
          locationId: null,
        }),
      );

      expectNoRecord(await notified);
      await sleep(DELIVERY_GRACE_MS);
      expect(otherSocket.received).not.toContain(eventName);
      expect(clinicianSocket.received).not.toContain(
        `${WS_EVENTS.DATABASE_TABLE_CHANGED}:appointments`,
      );
    });

    it('tells the clinician that a booking changed', async () => {
      const clinician = await createUser();
      const clinicianSocket = await connectAs(clinician, { facilityId });
      const notified = nextEvent(
        clinicianSocket,
        `${WS_EVENTS.CLINICIAN_BOOKINGS_UPDATE}:${clinician.id}`,
      );

      await models.Appointment.create(
        fake(models.Appointment, {
          patientId: encounter.patientId,
          clinicianId: clinician.id,
          locationGroupId: null,
          locationId: encounter.locationId,
        }),
      );

      expectNoRecord(await notified);
    });
  });

  describe('notifications', () => {
    it('tells only the notified user that their notifications changed', async () => {
      const user = await createUser();
      const userSocket = await connectAs(user, { facilityId });
      const otherSocket = await connectAs(await createUser(), { facilityId });
      const eventName = `${WS_EVENTS.DATABASE_TABLE_CHANGED}:notifications`;
      const notified = nextEvent(userSocket, eventName);

      await models.Notification.create(
        fake(models.Notification, { userId: user.id, patientId: encounter.patientId }),
      );

      expectNoRecord(await notified);
      await sleep(DELIVERY_GRACE_MS);
      expect(otherSocket.received).not.toContain(eventName);
    });
  });

  describe('settings', () => {
    it('tells every connection that settings have changed, without the changed row', async () => {
      const facilitySocket = await connectAs(await createUser(), { facilityId });
      const otherSocket = await connectAs(await createUser());
      const eventName = `${WS_EVENTS.DATABASE_TABLE_CHANGED}:settings`;
      const notifiedAtFacility = nextEvent(facilitySocket, eventName);
      const notifiedElsewhere = nextEvent(otherSocket, eventName);

      await models.Setting.set('audit.changes.enabled', true);

      expectNoRecord(await notifiedAtFacility);
      expectNoRecord(await notifiedElsewhere);
    });
  });
});

import { Server } from 'socket.io';

import { NOTIFY_CHANNELS, WS_EVENTS, WS_PATH } from '@tamanu/constants';
import { ReadSettings } from '@tamanu/settings';
import { log } from '@tamanu/shared/services/logging';
import { buildWebsocketHttpsGuard } from '@tamanu/shared/utils';

import { createWebsocketAuthMiddleware } from '../middleware/auth';
import { getServerFacilityIds } from '../serverConfig';

const RELAY_WINDOW_MS = 50;
const RELAY_LOOKUP_CHUNK_SIZE = 500;

const userRoom = userId => `user:${userId}`;
const facilityRoom = facilityId => `facility:${facilityId}`;

/**
 *
 * @param {{httpServer: import('http').Server, dbNotifier: Awaited<ReturnType<import('./dbNotifier')['defineDbNotifier']>>, models: import('@tamanu/database/models'), app: import('express').Express}} injector
 * @returns
 */
export const defineWebsocketService = injector => {
  // Resolved facility ids (facts/env/config), not raw config. Empty until
  // first-run setup completes; the https guard treats no readers as not-required.
  const facilityIds = getServerFacilityIds() ?? [];
  const settingsByFacility = facilityIds.reduce(
    (byFacility, facilityId) => ({
      ...byFacility,
      [facilityId]: new ReadSettings(injector.models, facilityId),
    }),
    {},
  );

  const socketServer = new Server(injector.httpServer, {
    path: WS_PATH,
    // A recovered connection runs the authentication middleware again, so it needs a valid token
    connectionStateRecovery: { skipMiddlewares: false, maxDisconnectionDuration: 120000 },
    // WebSocket upgrades bypass the Express middleware stack, so enforce security.requireHttps here.
    allowRequest: buildWebsocketHttpsGuard({
      getSettings: () => settingsByFacility,
      getTrustProxyFn: () => injector.app?.get('trust proxy fn'),
    }),
  });

  const getSocketServer = () => socketServer;

  socketServer.use(createWebsocketAuthMiddleware(injector.models));

  // Events about one user or one facility go to its room, so only the connections they concern
  // receive them. The facility is the one named in the connection's token.
  socketServer.on('connection', socket => {
    // A recovered connection gets back the rooms it had, which were for the token it held then
    for (const room of socket.rooms) {
      if (room !== socket.id) socket.leave(room);
    }

    const { user, facility } = socket.data;
    socket.join(userRoom(user.id));
    if (facility) {
      socket.join(facilityRoom(facility.id));
    }
  });

  const onMaterializedViewRefreshed =
    injector.dbNotifier.listeners[NOTIFY_CHANNELS.MATERIALIZED_VIEW_REFRESHED];
  onMaterializedViewRefreshed(viewName =>
    socketServer.emit(`${WS_EVENTS.DATABASE_MATERIALIZED_VIEW_REFRESHED}:${viewName}`),
  );

  /**
   * Each relay looks up a batch of changed records and calls `send(room, eventName)` for every
   * event they call for, with a null room for every connection.
   *
   * @type {Record<string, (ids: string[], send: (room: string | null, eventName: string) => void) => Promise<void>>}
   */
  const relays = {
    notifications: async (ids, send) => {
      const notifications = await injector.models.Notification.findAll({
        where: { id: ids },
        attributes: ['id', 'userId'],
        paranoid: false,
      });
      for (const { userId } of notifications) {
        if (userId) send(userRoom(userId), `${WS_EVENTS.DATABASE_TABLE_CHANGED}:notifications`);
      }
    },

    tasks: async (ids, send) => {
      const tasks = await injector.models.Task.findAll({
        where: { id: ids },
        attributes: ['id'],
        paranoid: false,
        include: [
          {
            attributes: ['id'],
            model: injector.models.Encounter,
            as: 'encounter',
            required: false,
            include: [
              {
                attributes: ['facilityId'],
                model: injector.models.Location,
                as: 'location',
                required: false,
              },
            ],
          },
          {
            attributes: ['id'],
            model: injector.models.ReferenceData,
            as: 'designations',
            required: false,
            include: [
              {
                attributes: ['id'],
                model: injector.models.User,
                as: 'designationUsers',
                required: true,
              },
            ],
          },
        ],
      });

      if (tasks.length < ids.length) {
        // A task has gone, so we can't tell which dashboards care. Tell all of them rather than
        // dropping the update.
        send(null, `${WS_EVENTS.CLINICIAN_DASHBOARD_TASKS_UPDATE}:all`);
      }

      for (const task of tasks) {
        const userIds = new Set(
          task.designations.flatMap(designation =>
            designation.designationUsers.map(user => user.id),
          ),
        );
        const facilityId = task.encounter?.location?.facilityId;

        if (userIds.size > 0) {
          for (const userId of userIds) {
            send(userRoom(userId), `${WS_EVENTS.CLINICIAN_DASHBOARD_TASKS_UPDATE}:${userId}`);
          }
        } else if (facilityId) {
          // An undesignated task shows on every clinician's dashboard at its own facility and
          // on nobody else's, so the facility is as wide as this fan-out needs to be.
          // Broadcasting to every connected client made one task change invalidate every
          // dashboard on the deployment, and tasks change constantly.
          send(
            facilityRoom(facilityId),
            `${WS_EVENTS.CLINICIAN_DASHBOARD_TASKS_UPDATE}:facility:${facilityId}`,
          );
        } else {
          // The task's encounter or that encounter's location has gone
          send(null, `${WS_EVENTS.CLINICIAN_DASHBOARD_TASKS_UPDATE}:all`);
        }
      }
    },

    appointments: async (ids, send) => {
      const appointments = await injector.models.Appointment.findAll({
        where: { id: ids },
        attributes: ['id', 'clinicianId', 'locationGroupId', 'locationId'],
        paranoid: false,
      });
      for (const { clinicianId, locationGroupId, locationId } of appointments) {
        if (!clinicianId) continue;
        if (!locationGroupId) {
          send(userRoom(clinicianId), `${WS_EVENTS.CLINICIAN_BOOKINGS_UPDATE}:${clinicianId}`);
        } else if (!locationId) {
          send(userRoom(clinicianId), `${WS_EVENTS.CLINICIAN_APPOINTMENTS_UPDATE}:${clinicianId}`);
        }
      }
    },
  };

  // A sync pull or bulk write sends a change notification per row, so changes are collected for a
  // short while and their records looked up together.
  const changedIdsByTable = new Map();
  let relayTimer = null;

  const relayChanges = async () => {
    relayTimer = null;
    const batches = [...changedIdsByTable];
    changedIdsByTable.clear();
    if (socketServer.sockets.sockets.size === 0) return;

    const sentEvents = new Set();
    const send = (room, eventName) => {
      const eventKey = `${room ?? ''} ${eventName}`;
      if (sentEvents.has(eventKey)) return;
      sentEvents.add(eventKey);
      (room ? socketServer.to(room) : socketServer).emit(eventName);
    };

    for (const [table, ids] of batches) {
      const idsToLookUp = [...ids];
      for (let start = 0; start < idsToLookUp.length; start += RELAY_LOOKUP_CHUNK_SIZE) {
        try {
          await relays[table](idsToLookUp.slice(start, start + RELAY_LOOKUP_CHUNK_SIZE), send);
        } catch (e) {
          log.error('Failed to relay websocket change notifications', { table, error: e.message });
        }
      }
    }
  };

  // Every listener in the web app refetches when told something changed, so events carry no
  // record, and only the tables it listens for are relayed.
  const onTableChanged = injector.dbNotifier.listeners[NOTIFY_CHANNELS.TABLE_CHANGED];
  onTableChanged(({ table, newId, oldId }) => {
    if (table === 'settings') {
      socketServer.emit(`${WS_EVENTS.DATABASE_TABLE_CHANGED}:settings`);
      return;
    }
    if (!Object.hasOwn(relays, table)) return;

    if (!changedIdsByTable.has(table)) changedIdsByTable.set(table, new Set());
    changedIdsByTable.get(table).add(newId ?? oldId);
    if (!relayTimer) {
      relayTimer = setTimeout(relayChanges, RELAY_WINDOW_MS);
      relayTimer.unref();
    }
  });

  /**
   * Sends an event to every connected user.
   *
   * @param {string} eventName
   * @param  {...unknown} args
   * @returns
   */
  const emit = (eventName, ...args) => socketServer.emit(eventName, ...args);
  return {
    getSocketServer,
    emit,
  };
};

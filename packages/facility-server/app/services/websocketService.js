import { Server } from 'socket.io';

import { NOTIFY_CHANNELS, WS_EVENTS, WS_PATH } from '@tamanu/constants';
import { ReadSettings } from '@tamanu/settings';
import { buildWebsocketHttpsGuard } from '@tamanu/shared/utils';

import { createWebsocketAuthMiddleware } from '../middleware/auth';
import { getServerFacilityIds } from '../serverConfig';

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

  const relayNotificationChange = async notificationId => {
    const notification = await injector.models.Notification.findByPk(notificationId, {
      attributes: ['id', 'userId'],
      paranoid: false,
    });
    if (!notification?.userId) return;

    socketServer
      .to(userRoom(notification.userId))
      .emit(`${WS_EVENTS.DATABASE_TABLE_CHANGED}:notifications`);
  };

  const relayTaskChange = async taskId => {
    const task = await injector.models.Task.findByPk(taskId, {
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

    const userIds = new Set(
      task?.designations?.flatMap(designation =>
        designation.designationUsers.map(user => user.id),
      ) ?? [],
    );
    const facilityId = task?.encounter?.location?.facilityId;

    if (userIds.size > 0) {
      for (const userId of userIds) {
        socketServer
          .to(userRoom(userId))
          .emit(`${WS_EVENTS.CLINICIAN_DASHBOARD_TASKS_UPDATE}:${userId}`);
      }
    } else if (facilityId) {
      // An undesignated task shows on every clinician's dashboard at its own facility and
      // on nobody else's, so the facility is as wide as this fan-out needs to be.
      // Broadcasting to every connected client made one task change invalidate every
      // dashboard on the deployment, and tasks change constantly.
      socketServer
        .to(facilityRoom(facilityId))
        .emit(`${WS_EVENTS.CLINICIAN_DASHBOARD_TASKS_UPDATE}:facility:${facilityId}`);
    } else {
      // The task, its encounter or that encounter's location has gone, so we can't tell
      // which dashboards care. Tell all of them rather than dropping the update.
      socketServer.emit(`${WS_EVENTS.CLINICIAN_DASHBOARD_TASKS_UPDATE}:all`);
    }
  };

  const relayAppointmentChange = async appointmentId => {
    const appointment = await injector.models.Appointment.findByPk(appointmentId, {
      attributes: ['id', 'clinicianId', 'locationGroupId', 'locationId'],
      paranoid: false,
    });
    if (!appointment?.clinicianId) return;

    const { clinicianId } = appointment;
    if (!appointment.locationGroupId) {
      socketServer
        .to(userRoom(clinicianId))
        .emit(`${WS_EVENTS.CLINICIAN_BOOKINGS_UPDATE}:${clinicianId}`);
    } else if (!appointment.locationId) {
      socketServer
        .to(userRoom(clinicianId))
        .emit(`${WS_EVENTS.CLINICIAN_APPOINTMENTS_UPDATE}:${clinicianId}`);
    }
  };

  // Every listener in the web app refetches when told something changed, so events carry no
  // record, and only the tables it listens for are relayed.
  const onTableChanged = injector.dbNotifier.listeners[NOTIFY_CHANNELS.TABLE_CHANGED];
  onTableChanged(async ({ table, newId, oldId }) => {
    const recordId = newId ?? oldId;
    switch (table) {
      case 'settings':
        socketServer.emit(`${WS_EVENTS.DATABASE_TABLE_CHANGED}:settings`);
        return;
      case 'notifications':
        await relayNotificationChange(recordId);
        return;
      case 'tasks':
        await relayTaskChange(recordId);
        return;
      case 'appointments':
        await relayAppointmentChange(recordId);
        return;
      default:
        return;
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

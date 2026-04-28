import { Server } from 'socket.io';

import { NOTIFY_CHANNELS, WS_EVENTS, WS_PATH } from '@tamanu/constants';

/**
 *
 * @param {{httpServer: import('http').Server, dbNotifier: Awaited<ReturnType<import('./dbNotifier')['defineDbNotifier']>>, models: import('@tamanu/database/models')}} injector
 * @returns
 */
export const defineWebsocketService = injector => {
  const socketServer = new Server(injector.httpServer, {
    path: WS_PATH,
    connectionStateRecovery: { skipMiddlewares: true, maxDisconnectionDuration: 120000 },
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  const getSocketServer = () => socketServer;

  const onMaterializedViewRefreshed =
    injector.dbNotifier.listeners[NOTIFY_CHANNELS.MATERIALIZED_VIEW_REFRESHED];
  onMaterializedViewRefreshed(viewName =>
    socketServer.emit(`${WS_EVENTS.DATABASE_MATERIALIZED_VIEW_REFRESHED}:${viewName}`),
  );

  const onTableChanged = injector.dbNotifier.listeners[NOTIFY_CHANNELS.TABLE_CHANGED];
  onTableChanged(payload => {
    socketServer.emit(`${WS_EVENTS.DATABASE_TABLE_CHANGED}:${payload.table}`, payload);
  });

  onTableChanged(async payload => {
    if (payload.table === 'tasks') {
      const task = await injector.models.Task.findOne({
        where: { id: payload.newId },
        include: [
          {
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

      if (userIds.size === 0) {
        socketServer.emit(`${WS_EVENTS.CLINICIAN_DASHBOARD_TASKS_UPDATE}:all`, task);
      } else {
        for (const userId of userIds) {
          socketServer.emit(`${WS_EVENTS.CLINICIAN_DASHBOARD_TASKS_UPDATE}:${userId}`, task);
        }
      }
    }
    if (payload.table === 'appointments') {
      const appointment = await injector.models.Appointment.findOne({
        where: { id: payload.newId },
      });

      if (!appointment) {
        return;
      }

      const userId = appointment.clinicianId;
      if (!appointment.locationGroupId) {
        socketServer.emit(`${WS_EVENTS.CLINICIAN_BOOKINGS_UPDATE}:${userId}`, appointment);
      } else if (!appointment.locationId) {
        socketServer.emit(`${WS_EVENTS.CLINICIAN_APPOINTMENTS_UPDATE}:${userId}`, appointment);
      }
    }
  });

  /**
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

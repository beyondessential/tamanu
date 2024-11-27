import { Server } from 'socket.io';

import { WS_EVENTS } from '@tamanu/constants';

/**
 *
 * @param {{httpServer: import('http').Server, dbNotifier: Awaited<ReturnType<import('./dbNotifier')['defineDbNotifier']>>, models: import('@tamanu/shared/models')}} injector
 * @returns
 */
export const defineWebsocketService = injector => {
  const socketServer = new Server(injector.httpServer, {
    connectionStateRecovery: { skipMiddlewares: true, maxDisconnectionDuration: 120000 },
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  const getSocketServer = () => socketServer;

  injector.dbNotifier.onMaterializedViewRefreshed(viewName =>
    socketServer.emit(`${WS_EVENTS.DATABASE_MATERIALIZED_VIEW_REFRESHED}:${viewName}`),
  );

  injector.dbNotifier.onTableChanged(payload => {
    socketServer.emit(`${WS_EVENTS.DATABASE_TABLE_CHANGED}:${payload.table}`, payload);
  });

  injector.dbNotifier.onTableChanged(async payload => {
    if (payload.table === 'tasks') {
      const task = await injector.models.Task.count({
        where: { id: payload.newId },
        include: [
          {
            attributes: ['designationUsers'],
            model: injector.models.ReferenceData,
            as: 'destination',
            required: true,
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
      for (const user of task.destination.designationUsers) {
        socketServer.emit(`${WS_EVENTS.CLINICIAN_DASHBOARD_TASKS_UPDATE}:${user.id}`, task);
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

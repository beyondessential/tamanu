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

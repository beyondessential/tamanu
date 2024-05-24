import { Server } from 'socket.io';

import { NOTIFY_CHANNELS, WS_EVENT_NAMESPACES } from '@tamanu/constants';

const setupDatabaseNotificationForwarding = (pg, socketServer) => {
  pg.on('notification', message => {
    const { channel, payload } = message;
    if (channel === NOTIFY_CHANNELS.DATA_UPDATED) {
      const viewName = payload;
      socketServer.emit(`${WS_EVENT_NAMESPACES.DATA_UPDATED}:${viewName}`);
    }
  });
  pg.query(`LISTEN ${NOTIFY_CHANNELS.DATA_UPDATED}`);
};

/**
 *
 * @param {{httpServer: import('http').Server}} injector
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

  setupDatabaseNotificationForwarding(injector.pg, socketServer);

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

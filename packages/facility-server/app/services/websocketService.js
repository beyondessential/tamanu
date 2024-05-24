import { Server } from 'socket.io';

import { NOTIFY_CHANNELS, WS_EVENT_NAMESPACES } from '@tamanu/constants';

const setupDatabaseNotificationForwarding = (pg, socket) => {
  pg.on('notification', message => {
    const { channel, payload } = message;
    if (channel === NOTIFY_CHANNELS.DATA_UPDATED) {
      const viewName = payload;
      socket.emit(`${WS_EVENT_NAMESPACES.DATA_UPDATED}:${viewName}`);
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
  const server = new Server(injector.httpServer, {
    connectionStateRecovery: { skipMiddlewares: true, maxDisconnectionDuration: 120000 },
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  const getServer = () => server;

  setupDatabaseNotificationForwarding(injector.pg, server);

  /**
   *
   * @param {string} eventName
   * @param  {...unknown} args
   * @returns
   */
  const emit = (eventName, ...args) => server.emit(eventName, ...args);
  return {
    getServer,
    emit,
  };
};

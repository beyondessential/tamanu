import { Server } from 'socket.io';

import { NOTIFY_CHANNELS } from '@tamanu/constants/database';

const setupDatabaseNotificationForwarding = (pg, socket) => {
  pg.on('notification', msg => {
    const { channel, payload } = msg;
    if (channel === NOTIFY_CHANNELS.DATA_UPDATED) {
      socket.emit(`data-updated:${payload}`);
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
  const socket = new Server(injector.httpServer, {
    connectionStateRecovery: { skipMiddlewares: true, maxDisconnectionDuration: 120000 },
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  const getServer = () => socket;

  setupDatabaseNotificationForwarding(injector.pg, socket);

  /**
   *
   * @param {string} eventName
   * @param  {...unknown} args
   * @returns
   */
  const emit = (eventName, ...args) => socket.emit(eventName, ...args);
  return {
    getServer,
    emit,
  };
};

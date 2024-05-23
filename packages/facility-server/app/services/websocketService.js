import { Server } from 'socket.io';

const setupDatabaseNotificationForwarding = (pg, socket) => {
  pg.on('notification', msg => {
    const { channel, payload } = msg;
    if (channel === 'refreshed_materialized_view') {
      socket.emit(`data-change:${payload}`);
    }
  });
  pg.query('LISTEN refreshed_materialized_view');
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

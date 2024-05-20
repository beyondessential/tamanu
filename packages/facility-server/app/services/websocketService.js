import { WS_EVENTS } from '@tamanu/constants';
import { Server } from 'socket.io';

const setupDatabaseNotificationForwarding = (pg, server) => {
  pg.on('notification', msg => {
    if (msg.channel === 'refreshed_materialized_view') {
      server.emit(WS_EVENTS.REFRESHED_MATERIALIZED_VIEW, msg.payload);
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

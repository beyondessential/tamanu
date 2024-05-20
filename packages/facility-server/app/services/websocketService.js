import { WS_EVENTS } from '@tamanu/constants';
import { Server } from 'socket.io';
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

  injector.pg.on('notification', msg => {
    // check if message is for refreshed materialized view
    if (msg.channel === 'refreshed_materialized_view') {
      server.emit(WS_EVENTS.REFRESHED_MATERIALIZED_VIEW, msg.payload);
    }
  });

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

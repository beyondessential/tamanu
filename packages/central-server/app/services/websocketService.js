import { Server } from 'socket.io';

/**
 *
 * @param {{ httpServer: import('http').Server}} injector
 * @returns
 */
export const defineWebsocketService = injector => {
  const server = new Server(injector.httpServer, {
    connectionStateRecovery: { skipMiddlewares: true, maxDisconnectionDuration: 120000 },
  });
  const getServer = () => server;

  /**
   *
   * @param {string} eventName
   * @param  {...unknown} args
   * @returns
   */
  const emit = (eventName, ...args) => server.emit(eventName, ...args);

  const registerEvent = (eventName, handler) => {
    server.on('connection', socket => {
      socket.on(eventName, handler);
    });
  };

  return {
    getServer,
    emit,
    registerEvent,
  };
};

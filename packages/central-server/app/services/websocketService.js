import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/postgres-adapter';
import { log } from '@tamanu/shared/services/logging';

/**
 *
 * @param {{ httpServer: import('http').Server, sequelize: import('sequelize').Sequelize}} injector
 * @returns
 */
export const defineWebsocketService = async injector => {
  const server = new Server(injector.httpServer, {
    connectionStateRecovery: { skipMiddlewares: true, maxDisconnectionDuration: 120000 },
  });
  const getServer = () => server;

  const connection = await injector.sequelize.connectionManager
    .getConnection()
    .catch(e => log.error('Error in sequelize connectionManager', e));
  if (connection) {
    server.adapter(
      createAdapter(
        {
          query: async (sql, bind) => {
            const result = await injector.sequelize.query(sql, { bind, type: sql.split(' ')?.[0] });
            return { rows: result[0] };
          },
          connect: async () => connection,
        },
        {
          errorHandler: e => log.error('Error in postgres adapter', e),
        },
      ),
    );
  }
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

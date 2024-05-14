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

  let connection;
  try {
    await injector.sequelize.authenticate();
    connection = await injector.sequelize.connectionManager.getConnection();
  } catch (e) {
    log.error('Error in sequelize connectionManager', e);
  }

  if (connection) {
    server.adapter(
      createAdapter(
        // just a hack because we can't get the pg.Pool instance from sequelize instance directly so we pass the connection object which is the pg.Pool instance
        {
          query: async (sql, bind) => {
            await injector.sequelize.authenticate();
            const result = await injector.sequelize.query(sql, { bind, type: sql.split(' ')?.[0] });
            return { rows: result[0] };
          },
          connect: async () => {
            await injector.sequelize.authenticate();
            return connection
          },
        },
        {
          errorHandler: e => log.error('Error in postgres adapter:', e),
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

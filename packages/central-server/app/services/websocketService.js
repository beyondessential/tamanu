import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/postgres-adapter';
import { log } from '@tamanu/shared/services/logging';
import { NOTIFY_CHANNELS, WS_EVENTS, WS_PATH } from '@tamanu/constants';

/**
 *
 * @param {{ httpServer: import('http').Server, sequelize: import('sequelize').Sequelize, dbNotifier?: Awaited<ReturnType<import('@tamanu/shared/services/dbNotifier').defineDbNotifier>>}} injector
 * @returns
 */
export const defineWebsocketService = async injector => {
  const socketServer = new Server(injector.httpServer, {
    path: WS_PATH,
    connectionStateRecovery: { skipMiddlewares: true, maxDisconnectionDuration: 120000 },
  });
  const getSocketServer = () => socketServer;

  injector.dbNotifier?.listeners[NOTIFY_CHANNELS.TABLE_CHANGED]?.(payload => {
    socketServer.emit(`${WS_EVENTS.DATABASE_TABLE_CHANGED}:${payload.table}`, payload);
  });

  const testMode = process.env.NODE_ENV === 'test';

  let connection;
  try {
    if (!testMode) {
      connection = await injector.sequelize.connectionManager.getConnection();
    }
  } catch (e) {
    log.error('Error in sequelize connectionManager', e);
  }

  if (connection) {
    socketServer.adapter(
      createAdapter(
        // just a hack because we can't get the pg.Pool instance from sequelize instance directly so we pass the connection object which is the pg.Pool instance
        {
          query: async (sql, bind) => {
            const result = await injector.sequelize.query(sql, { bind, type: sql.split(' ')?.[0] });
            return { rows: result[0] };
          },
          connect: async () => {
            return connection;
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
  const emit = (eventName, ...args) => socketServer.emit(eventName, ...args);

  const registerEvent = (eventName, handler) => {
    socketServer.on('connection', socket => {
      socket.on(eventName, handler);
    });
  };

  return {
    getSocketServer,
    emit,
    registerEvent,
  };
};

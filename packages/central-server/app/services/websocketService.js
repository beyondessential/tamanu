import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/postgres-adapter';
import { log } from '@tamanu/shared/services/logging';
import { runWithAuditUser } from '@tamanu/database/utils/audit';
import { NOTIFY_CHANNELS, WS_EVENTS, WS_PATH } from '@tamanu/constants';
import { ReadSettings } from '@tamanu/settings';
import {
  buildWebsocketHttpsGuard,
  getAuthSecret,
  getCanonicalHostName,
} from '@tamanu/shared/utils';
import { buildWebsocketAuthMiddleware } from '@tamanu/shared/utils/websocketAuth';

/**
 *
 * @param {{ httpServer: import('http').Server, sequelize: import('sequelize').Sequelize, models: import('@tamanu/database/models'), app: import('express').Express, dbNotifier?: Awaited<ReturnType<import('@tamanu/shared/services/dbNotifier').defineDbNotifier>>}} injector
 * @returns
 */
export const defineWebsocketService = async injector => {
  const settings = new ReadSettings(injector.models);
  const socketServer = new Server(injector.httpServer, {
    path: WS_PATH,
    // A recovered connection runs the authentication middleware again, so it needs a valid token
    connectionStateRecovery: { skipMiddlewares: false, maxDisconnectionDuration: 120000 },
    // WebSocket upgrades bypass the Express middleware stack, so enforce security.requireHttps here.
    allowRequest: buildWebsocketHttpsGuard({
      getSettings: () => settings,
      getTrustProxyFn: () => injector.app?.get('trust proxy fn'),
    }),
  });
  const getSocketServer = () => socketServer;

  socketServer.use(
    buildWebsocketAuthMiddleware({
      models: injector.models,
      tokenIssuer: getCanonicalHostName(),
      tokenSecret: getAuthSecret(),
    }),
  );

  // The admin panel refetches its settings when told they changed, so that is the only table
  // relayed, and without the changed row or columns. Every other table change listener in the web
  // app is on a screen only the facility server serves, and the facility server relays those.
  // Each instance gets table_changed from postgres directly; relaying via the adapter costs a
  // pooled query per row.
  injector.dbNotifier?.listeners[NOTIFY_CHANNELS.TABLE_CHANGED]?.(({ table }) => {
    if (table !== 'settings') return;
    socketServer.local.emit(`${WS_EVENTS.DATABASE_TABLE_CHANGED}:settings`);
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

  /**
   * @param {string} eventName
   * @param {(socket: import('socket.io').Socket, ...args: unknown[]) => unknown} handler
   */
  const registerEvent = (eventName, handler) => {
    socketServer.on('connection', socket => {
      // Changes an event makes are recorded against the connected user, as for an HTTP request.
      // socket.io ignores the handler's promise, so a failure is caught here. Only the message is
      // logged, as the error can carry the event's patient data.
      socket.on(eventName, async (...args) => {
        try {
          await runWithAuditUser(socket.data.user.id, () => handler(socket, ...args));
        } catch (e) {
          log.error('Websocket event handler failed', { eventName, error: e.message });
        }
      });
    });
  };

  return {
    getSocketServer,
    emit,
    registerEvent,
  };
};

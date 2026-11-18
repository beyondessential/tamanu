import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/postgres-adapter';
import { log } from '@tamanu/shared/services/logging';
import { WS_PATH } from '@tamanu/constants';
import { ReadSettings } from '@tamanu/settings';
import {
  buildWebsocketHttpsGuard,
  getAuthSecret,
  getCanonicalHostName,
} from '@tamanu/shared/utils';
import { decodeJwt } from 'jose';

// setTimeout fires immediately for a delay beyond this
const MAX_TIMER_DELAY_MS = 2 ** 31 - 1;

// A token is only checked at the handshake, so end the connection when it expires; clients
// reconnect with a fresh one.
const scheduleDisconnectAtExpiry = (socket, expirySeconds) => {
  if (!expirySeconds) return;
  const delay = Math.min(expirySeconds * 1000 - Date.now(), MAX_TIMER_DELAY_MS);
  const timer = setTimeout(() => socket.disconnect(true), delay);
  timer.unref();
  socket.on('disconnect', () => clearTimeout(timer));
};

/**
 *
 * @param {{ httpServer: import('http').Server, sequelize: import('sequelize').Sequelize, models: import('@tamanu/database/models'), app: import('express').Express}} injector
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

  // Only a client holding a valid access token may connect. The token is the one the client uses
  // for the HTTP API, sent as `auth.token` in the handshake.
  socketServer.use(async (socket, next) => {
    try {
      const { token } = socket.handshake.auth ?? {};
      if (typeof token !== 'string' || token.length === 0) {
        throw new Error('Missing token');
      }

      const tokenDuration = await settings.get('auth.tokenDuration');
      const { user, impersonateRoleId } = await injector.models.User.loginFromToken(token, {
        log,
        settings,
        tokenDuration,
        tokenIssuer: getCanonicalHostName(),
        tokenSecret: getAuthSecret(),
      });

      // each socket is only authenticated by its own handshake, so nothing else writes this
      // eslint-disable-next-line require-atomic-updates
      socket.data = { user, impersonateRoleId };
      scheduleDisconnectAtExpiry(socket, decodeJwt(token).exp);
      next();
    } catch (e) {
      log.warn('Rejected websocket connection', { reason: e.message });
      next(new Error('Unauthorised'));
    }
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
      socket.on(eventName, (...args) => handler(socket, ...args));
    });
  };

  return {
    getSocketServer,
    emit,
    registerEvent,
  };
};

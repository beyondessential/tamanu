import { decodeJwt } from 'jose';

import { log } from '../services/logging';

// setTimeout fires immediately for a delay beyond this
const MAX_TIMER_DELAY_MS = 2 ** 31 - 1;

// A token is only checked at the handshake, so end the connection when it expires; clients
// reconnect with a fresh one.
const scheduleDisconnectAtExpiry = (socket, expiresAtSeconds) => {
  if (!expiresAtSeconds) return;
  const delay = Math.min(expiresAtSeconds * 1000 - Date.now(), MAX_TIMER_DELAY_MS);
  const timer = setTimeout(() => socket.disconnect(true), delay);
  timer.unref();
  socket.on('disconnect', () => clearTimeout(timer));
};

/**
 * socket.io middleware that only lets a client holding a valid access token connect. The token is
 * the one the client uses for the server's HTTP API, sent as `auth.token` in the handshake.
 *
 * On success, `socket.data` holds the `user`, `device`, `facility` and `impersonateRoleId` the
 * token was issued for. The connection is ended when the token expires.
 *
 * @param {{ models: import('@tamanu/database/models'), tokenIssuer: string, tokenSecret: string }} options
 * @returns {(socket: import('socket.io').Socket, next: (error?: Error) => void) => Promise<void>}
 */
export function buildWebsocketAuthMiddleware({ models, tokenIssuer, tokenSecret }) {
  return async (socket, next) => {
    try {
      const { token } = socket.handshake.auth ?? {};
      if (typeof token !== 'string' || token.length === 0) {
        throw new Error('Missing token');
      }

      const { user, device, facility, impersonateRoleId } = await models.User.loginFromToken(
        token,
        { tokenIssuer, tokenSecret },
      );
      // Verification allows for clock skew, which would accept a token only to end the connection
      // straight away
      const expiresAtSeconds = decodeJwt(token).exp;
      if (expiresAtSeconds && expiresAtSeconds * 1000 <= Date.now()) {
        throw new Error('Token expired');
      }

      // each socket is only authenticated by its own handshake, so nothing else writes this
      // eslint-disable-next-line require-atomic-updates
      socket.data = { user, device, facility, impersonateRoleId };
      scheduleDisconnectAtExpiry(socket, expiresAtSeconds);
      next();
    } catch (e) {
      log.warn('Rejected websocket connection', { reason: e.message });
      next(new Error('Unauthorised'));
    }
  };
}

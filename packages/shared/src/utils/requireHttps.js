import asyncPool from 'tiny-async-pool';

import { ForbiddenError } from '@tamanu/errors';

const REQUIRE_HTTPS_SETTING = 'security.requireHttps';

// Cap concurrent setting reads on a multi-facility server so we don't fan out one DB read per
// hosted facility unbounded; the value is in practice cached, but the read pool is finite.
const SETTING_READ_CONCURRENCY = 3;

/**
 * Resolve whether HTTPS is required from `req.settings`, which differs by server:
 * - central server: a single `ReadSettings` instance (reads the central-scoped setting)
 * - facility server: a map of `facilityId -> ReadSettings` (reads the facility-scoped setting)
 *
 * For a facility server hosting more than one facility the protocol is fixed before we know which
 * facility a request targets, so we enforce if *any* hosted facility requires HTTPS.
 */
export async function isHttpsRequired(settings) {
  if (!settings) {
    return false;
  }
  if (typeof settings.get === 'function') {
    return Boolean(await settings.get(REQUIRE_HTTPS_SETTING));
  }
  const values = await asyncPool(SETTING_READ_CONCURRENCY, Object.values(settings), (reader) =>
    reader.get(REQUIRE_HTTPS_SETTING),
  );
  return values.some(Boolean);
}

/**
 * Rejects requests that did not arrive over HTTPS when the `security.requireHttps` setting is on.
 *
 * `req.secure` reflects the original client protocol via `X-Forwarded-Proto` because both servers
 * set `trust proxy` from `config.proxy.trusted` (loopback by default). Operators must therefore run
 * a TLS-terminating proxy that is trusted and forwards that header, or every request will be
 * rejected once the setting is enabled. Must run after `settingsReaderMiddleware` so `req.settings`
 * is available.
 */
export const requireHttps = async (req, res, next) => {
  try {
    if (!req.secure && (await isHttpsRequired(req.settings))) {
      next(new ForbiddenError('This server only accepts requests over HTTPS.'));
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Determine whether a raw request (e.g. a WebSocket upgrade that bypasses Express) arrived over
 * HTTPS, mirroring how Express computes `req.secure`. `trustProxyFn` is Express's compiled trust
 * function (`app.get('trust proxy fn')`); when the immediate peer is trusted we honour the first
 * `X-Forwarded-Proto` value, exactly as Express derives `req.protocol`.
 */
export function isRawRequestSecure(req, trustProxyFn) {
  const socket = req.socket ?? req.connection;
  if (socket?.encrypted) {
    return true;
  }
  if (typeof trustProxyFn === 'function' && trustProxyFn(socket?.remoteAddress, 0)) {
    const header = req.headers?.['x-forwarded-proto'];
    if (header) {
      return header.split(',')[0].trim() === 'https';
    }
  }
  return false;
}

/**
 * Build a Socket.IO `allowRequest` handler that rejects WebSocket handshakes that did not arrive
 * over HTTPS when `security.requireHttps` is in effect. WebSocket upgrades attach to the HTTP server
 * directly and never pass through the Express middleware stack, so they need their own gate.
 *
 * `getSettings` returns the same shape as `req.settings` (a `ReadSettings` for central, or a
 * `facilityId -> ReadSettings` map for facility); `getTrustProxyFn` returns the server's compiled
 * trust-proxy function. Fails closed (rejects) if the setting cannot be read.
 */
export function buildWebsocketHttpsGuard({ getSettings, getTrustProxyFn }) {
  return (req, callback) => {
    (async () => {
      if (isRawRequestSecure(req, getTrustProxyFn())) {
        return true;
      }
      return !(await isHttpsRequired(getSettings()));
    })().then(
      (allowed) => callback(allowed ? null : 'This server only accepts connections over HTTPS.', allowed),
      () => callback('This server only accepts connections over HTTPS.', false),
    );
  };
}

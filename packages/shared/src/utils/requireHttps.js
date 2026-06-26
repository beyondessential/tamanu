import { ForbiddenError } from '@tamanu/errors';

const REQUIRE_HTTPS_SETTING = 'security.requireHttps';

/**
 * Resolve whether HTTPS is required from `req.settings`, which differs by server:
 * - central server: a single `ReadSettings` instance (reads the central-scoped setting)
 * - facility server: a map of `facilityId -> ReadSettings` (reads the facility-scoped setting)
 *
 * For a facility server hosting more than one facility the protocol is fixed before we know which
 * facility a request targets, so we enforce if *any* hosted facility requires HTTPS.
 */
async function isHttpsRequired(settings) {
  if (!settings) {
    return false;
  }
  if (typeof settings.get === 'function') {
    return Boolean(await settings.get(REQUIRE_HTTPS_SETTING));
  }
  const values = await Promise.all(
    Object.values(settings).map((reader) => reader.get(REQUIRE_HTTPS_SETTING)),
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

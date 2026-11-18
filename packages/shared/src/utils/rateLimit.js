import { rateLimit } from 'express-rate-limit';

import { RateLimitedError } from '@tamanu/errors';
import { log } from '../services/logging';

// Rate limiting is disabled automatically during tests to keep existing
// test suites (which rapidly hammer endpoints like /login from the same
// loopback IP) deterministic. TEST_RATE_LIMITING=enabled opts back in so the
// limiters themselves can be tested.
const rateLimitingDisabled = () =>
  process.env.NODE_ENV === 'test' && process.env.TEST_RATE_LIMITING !== 'enabled';

const noopMiddleware = (_req, _res, next) => next();

// `express-rate-limit` keys off `req.ip`, which respects the `trust proxy`
// setting configured on the express app. Rejections are surfaced through the
// existing error handler via `RateLimitedError` so the JSON response stays
// consistent with the rest of the API (RFC 7807 + legacy error shape).
const makeLimiter = ({ name, windowMs, max, skipSuccessfulRequests = false }) =>
  rateLimit({
    windowMs,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: (req, _res, next) => {
      log.info('rateLimit: request blocked', {
        name,
        ip: req.ip,
        path: req.originalUrl,
      });
      next(new RateLimitedError(Math.ceil(windowMs / 1000), 'Too many requests'));
    },
  });

const DEFAULT_GLOBAL = { windowMs: 60 * 1000, max: 600 };
const DEFAULT_AUTH = { windowMs: 15 * 60 * 1000, max: 30 };

const NOOP_LIMITERS = {
  globalLimiter: noopMiddleware,
  authLimiter: noopMiddleware,
  labResultWidgetLimiter: noopMiddleware,
};

/**
 * Returns the express rate-limiting middlewares:
 *  - `globalLimiter`: permissive, applied to every request as a DoS backstop.
 *  - `authLimiter`: strict, applied to unauthenticated / expensive endpoints
 *    (login, refresh, password reset, patient-portal login). Successful
 *    requests are not counted, so only failed/abusive traffic accumulates
 *    toward the limit.
 *  - `labResultWidgetLimiter`: applied to the central server's public lab
 *    result widget. Every lookup counts, since one that matches nothing still
 *    succeeds. Built only when `rateLimit.labResultWidget` is given (central
 *    settings); a no-op otherwise.
 *
 * All limiters are no-ops when `NODE_ENV === 'test'` or when the passed-in
 * `rateLimit.enabled === false`.
 *
 * Limits come from the caller's `rateLimit.{global,auth,labResultWidget}.{windowMs,max}`
 * settings. `skipSuccessfulRequests` for the auth limiter is always true and cannot be
 * overridden (spread order below).
 */
export const buildRateLimiters = (rateLimitConfig = {}) => {
  if (rateLimitingDisabled() || rateLimitConfig.enabled === false) {
    return NOOP_LIMITERS;
  }

  const {
    global: globalConfig = DEFAULT_GLOBAL,
    auth: authConfig = DEFAULT_AUTH,
    labResultWidget: labResultWidgetConfig,
  } = rateLimitConfig;

  return {
    globalLimiter: makeLimiter({ name: 'global', ...globalConfig }),
    authLimiter: makeLimiter({
      name: 'auth',
      ...authConfig,
      // Must follow spread: config must not override this safety-critical flag.
      skipSuccessfulRequests: true,
    }),
    labResultWidgetLimiter: labResultWidgetConfig
      ? makeLimiter({ name: 'labResultWidget', ...labResultWidgetConfig })
      : noopMiddleware,
  };
};

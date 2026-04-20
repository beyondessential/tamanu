import config from 'config';
import { rateLimit } from 'express-rate-limit';

import { RateLimitedError } from '@tamanu/errors';
import { log } from '../services/logging';

// Rate limiting is disabled automatically during tests to keep existing
// test suites (which rapidly hammer endpoints like /login from the same
// loopback IP) deterministic.
const RATE_LIMITING_DISABLED = process.env.NODE_ENV === 'test';

const noopMiddleware = (_req, _res, next) => next();

const getRateLimitConfig = () => {
  // tolerate the config section being absent so older local configs keep working
  return config.has('rateLimit') ? config.get('rateLimit') : {};
};

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

/**
 * Returns a pair of express middlewares:
 *  - `globalLimiter`: permissive, applied to every request as a DoS backstop.
 *  - `authLimiter`: strict, applied to unauthenticated / expensive endpoints
 *    (login, refresh, password reset, patient-portal login). Successful
 *    requests are not counted, so only failed/abusive traffic accumulates
 *    toward the limit.
 *
 * Both limiters are no-ops when `NODE_ENV === 'test'` or when
 * `config.rateLimit.enabled === false`.
 *
 * Reads limits from `config.rateLimit.{global,auth}.{windowMs,max}`.
 * `skipSuccessfulRequests` for the auth limiter is always true and cannot be
 * overridden by config (spread order below).
 */
export const buildRateLimiters = () => {
  if (RATE_LIMITING_DISABLED) {
    return { globalLimiter: noopMiddleware, authLimiter: noopMiddleware };
  }

  const rateLimitConfig = getRateLimitConfig();
  if (rateLimitConfig.enabled === false) {
    return { globalLimiter: noopMiddleware, authLimiter: noopMiddleware };
  }

  const { global: globalConfig = DEFAULT_GLOBAL, auth: authConfig = DEFAULT_AUTH } =
    rateLimitConfig;

  return {
    globalLimiter: makeLimiter({ name: 'global', ...globalConfig }),
    authLimiter: makeLimiter({
      name: 'auth',
      ...authConfig,
      // Must follow spread: config must not override this safety-critical flag.
      skipSuccessfulRequests: true,
    }),
  };
};

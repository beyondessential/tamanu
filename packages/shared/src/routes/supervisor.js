import { createHash, timingSafeEqual } from 'node:crypto';
import express from 'express';
import asyncHandler from 'express-async-handler';
import ms from 'ms';

import { InvalidCredentialError } from '@tamanu/errors';

// How long a hold lasts unless released first: long enough for the supervisor to stop the tasks
// process once the hold is set, short enough that a supervisor which never comes back to release
// it does not hold scheduled tasks for long.
export const TASK_HOLD_DURATION_MS = ms('10 minutes');

const sha256 = value => createHash('sha256').update(value).digest();

// Compared as digests so the two sides are always the same length, which lets timingSafeEqual
// run without leaking the length of the expected token.
const isSameToken = (given, expected) => timingSafeEqual(sha256(given), sha256(expected));

// spec: SUPV#talking-to-the-server
// The supervisor credential is a bearer token from the SUPERVISOR_TOKEN environment variable.
// Unset or empty means no caller is the supervisor, so every request is rejected. A failure never says whether the token was unset or merely wrong.
const requireSupervisorToken = (req, _res, next) => {
  // The supervisor credential is the whole of the authorisation: there is no user, and so no
  // user permission to check.
  req.flagPermissionChecked?.();

  const expected = process.env.SUPERVISOR_TOKEN;
  const [scheme, given] = (req.get('authorization') ?? '').split(' ');
  const isSupervisor =
    typeof expected === 'string' &&
    expected.length > 0 &&
    scheme.toLowerCase() === 'bearer' &&
    Boolean(given) &&
    isSameToken(given, expected);
  if (!isSupervisor) throw new InvalidCredentialError();
  next();
};

/**
 * Routes for the server's own supervisor, mounted outside the user authentication: the supervisor
 * credential is the authentication. Each server adds its own routes to the returned router, behind
 * the same credential.
 *
 * Uses `req.models` and `req.db`, as both servers set them.
 *
 * @param {{ version: string }} serverInfo
 */
export function supervisorRoutes({ version }) {
  const routes = express.Router();
  routes.use(requireSupervisorToken);

  // spec: SLPWK#going-to-sleep
  // Holds scheduled tasks unless the server is busy, in one transaction. Not busy means nothing
  // was running when the hold was set, and no scheduled task starts a run until the hold expires
  // or is released. A busy server is left without a hold.
  routes.post(
    '/hold',
    asyncHandler(async (req, res) => {
      res.json(await req.models.ScheduledTaskState.holdUnlessBusy(TASK_HOLD_DURATION_MS));
    }),
  );

  // spec: SLPWK#going-to-sleep
  // Releases the hold, once the server is awake again or the sleep is cancelled. Releasing when
  // there is no hold does nothing.
  routes.delete(
    '/hold',
    asyncHandler(async (req, res) => {
      await req.models.ScheduledTaskState.releaseHold();
      res.status(204).end();
    }),
  );

  // spec: SUPV#talking-to-the-server
  // The release the server runs, so the supervisor only puts a server to sleep whose database is
  // migrated to the supervisor's own release.
  routes.get('/status', (_req, res) => {
    res.json({ version });
  });

  return routes;
}

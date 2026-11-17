import { createHash, timingSafeEqual } from 'node:crypto';
import express from 'express';
import asyncHandler from 'express-async-handler';
import ms from 'ms';

import { InvalidCredentialError } from '@tamanu/errors';

// Long enough to stop the tasks process; short enough that a supervisor which never releases the
// hold does not stop tasks for long.
export const TASK_HOLD_DURATION_MS = ms('10 minutes');

const sha256 = value => createHash('sha256').update(value).digest();

// Compared as digests so the two sides are always the same length, which lets timingSafeEqual
// run without leaking the length of the expected token.
const isSameToken = (given, expected) => timingSafeEqual(sha256(given), sha256(expected));

// spec: SUPV#talking-to-the-server
const requireSupervisorToken = (req, _res, next) => {
  // no user, so no user permission to check
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
 * Routes for the server's own supervisor, behind its credential. Each server adds its own.
 *
 * @param {{ version: string }} serverInfo
 */
export function supervisorRoutes({ version }) {
  const routes = express.Router();
  routes.use(requireSupervisorToken);

  // spec: SLPWK#going-to-sleep
  routes.post(
    '/hold',
    asyncHandler(async (req, res) => {
      res.json(await req.models.ScheduledTaskState.holdUnlessBusy(TASK_HOLD_DURATION_MS));
    }),
  );

  // spec: SLPWK#going-to-sleep
  routes.delete(
    '/hold',
    asyncHandler(async (req, res) => {
      await req.models.ScheduledTaskState.releaseHold();
      res.status(204).end();
    }),
  );

  // spec: SUPV#talking-to-the-server
  routes.get('/status', (_req, res) => {
    res.json({ version });
  });

  return routes;
}

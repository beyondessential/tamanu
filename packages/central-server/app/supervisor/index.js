import { createHash, timingSafeEqual } from 'node:crypto';
import config from 'config';
import express from 'express';
import asyncHandler from 'express-async-handler';

import { InvalidCredentialError } from '@tamanu/errors';

import { CentralSyncManager, getHighestRealChangeTick } from '../sync';
import { countPendingWork } from '../tasks/pendingWork';

const sha256 = value => createHash('sha256').update(value).digest();

// Compared as digests so the two sides are always the same length, which lets timingSafeEqual
// run without leaking the length of the configured token.
const isSameToken = (given, expected) => timingSafeEqual(sha256(given), sha256(expected));

// The supervisor credential is a bearer token from config (`supervisor.token`, or the
// SUPERVISOR_TOKEN environment variable). Unset or empty means no caller is the supervisor, so
// every request is rejected. Read per request so a changed config applies without rebuilding the
// router. A failure never says whether the token was unset or merely wrong.
const requireSupervisorToken = (req, _res, next) => {
  const expected = config.supervisor?.token;
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
 * Routes for central's own supervisor, mounted outside the user authentication: the supervisor
 * credential is the authentication, and there are no user permissions to check.
 *
 * @param {import('../ApplicationContext').ApplicationContext} ctx
 */
export const supervisorRoutes = ctx => {
  const routes = express.Router();
  routes.use(requireSupervisorToken);

  // spec: LOOKUP#refreshing-on-demand
  // Runs a lookup table build (both passes), waiting for a running one first. Answers once the
  // build has committed and its rows have settled ticks. A build that aborts answers with an
  // error, not a success.
  const centralSyncManager = new CentralSyncManager(ctx);
  routes.post(
    '/lookup-refresh',
    asyncHandler(async (req, res) => {
      await centralSyncManager.updateLookupTable();
      res.json({ highestRealChangeTick: await getHighestRealChangeTick(req.models) });
    }),
  );

  // spec: SLPWK#going-to-sleep
  // Whether any work queue has pending items, so the supervisor does not put a busy server to sleep
  routes.get(
    '/busy',
    asyncHandler(async (_req, res) => {
      const pending = await countPendingWork(ctx);
      res.json({ busy: Object.values(pending).some(count => count > 0), pending });
    }),
  );

  return routes;
};

import asyncHandler from 'express-async-handler';

import { log } from '@tamanu/shared/services/logging';
import { supervisorRoutes } from '@tamanu/shared/routes/supervisor';

import { version } from '../serverInfo';

// Why a final sync did not complete, from what the sync process answered.
function incompleteReason({ enabled, queued, ran }) {
  if (!enabled) return 'Sync is disabled';
  if (queued) return 'Sync was queued by the central server';
  if (!ran) return 'Sync did not run';
  return null;
}

/** The supervisor's routes on a facility server: the shared ones, and the final sync. */
export function facilitySupervisorRoutes() {
  const routes = supervisorRoutes({ version });

  // spec: SLPWK#going-to-sleep
  // Through the sync process as `POST /sync/run` does, bounded by that request's timeouts.
  routes.post(
    '/final-sync',
    asyncHandler(async (req, res) => {
      let reason;
      try {
        const result = await req.syncConnection.runSync({ urgent: true, type: 'finalSync' });
        reason = incompleteReason(result);
      } catch (error) {
        log.warn('Supervisor final sync failed', { error: error.message });
        reason = error.message;
      }
      res.json(reason ? { completed: false, reason } : { completed: true });
    }),
  );

  return routes;
}

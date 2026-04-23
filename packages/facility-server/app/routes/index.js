import express from 'express';
import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';
import { createApiv1 } from './apiv1';

/**
 * @param {{ globalLimiter: import('express').RequestHandler; authLimiter: import('express').RequestHandler }} limiters
 */
export function createRoutes(limiters) {
  const router = express.Router();
  const apiv1 = createApiv1(limiters);

  router.use(ensurePermissionCheck);

  // API
  router.use('/api', apiv1);

  // Legacy API endpoint
  router.use('/v1', apiv1);

  return router;
}

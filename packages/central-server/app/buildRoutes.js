import express from 'express';
import asyncHandler from 'express-async-handler';
import * as z from 'zod';
import { AuthPermissionError } from '@tamanu/errors';
import { ReadSettings } from '@tamanu/settings';
import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';

import { buildSyncRoutes } from './sync';
import { attachmentRoutes } from './attachment';
import { facilityRoutes } from './facility';
import { healthRoutes } from './health';
import { integrationRoutes } from './integrations';
import { adminRoutes } from './admin';
import { suggestionsRoutes } from './suggestions';
import { aiRoutes } from './ai';
import { systemErrorReport } from './systemErrorReport';

export const buildRoutes = ctx => {
  const routes = express.Router();

  routes.get(
    '/settings/frontEnd',
    ensurePermissionCheck,
    asyncHandler(async (req, res) => {
      req.flagPermissionChecked();
      const { facilityId } = z.object({ facilityId: z.string().optional() }).parse(req.query);
      if (!facilityId) {
        // The admin panel's session has no facility. This is the payload /login gives any
        // signed-in user, so being signed in is the only permission it needs.
        res.send({ settings: await req.settings.getFrontEndSettings() });
        return;
      }

      const userInstance = await req.models.User.findByPk(req.user.id);
      const hasAccess = await userInstance.canAccessFacility(facilityId);
      if (!hasAccess) {
        throw new AuthPermissionError('User does not have access to facility');
      }

      const reader = new ReadSettings(req.models, facilityId);
      res.send({ settings: await reader.getFrontEndSettings() });
    }),
  );

  routes.use('/sync', buildSyncRoutes(ctx));
  routes.use('/attachment', attachmentRoutes);
  routes.use('/facility', facilityRoutes);
  routes.use('/health', healthRoutes);
  routes.use('/integration', integrationRoutes);
  routes.use('/admin', adminRoutes);
  routes.use('/suggestions', suggestionsRoutes);
  routes.use('/ai', aiRoutes);
  routes.use('/systemErrorReport', systemErrorReport);

  return routes;
};

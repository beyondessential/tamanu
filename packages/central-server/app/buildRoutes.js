import express from 'express';
import asyncHandler from 'express-async-handler';
import * as z from 'zod';
import { AuthPermissionError } from '@tamanu/errors';
import { ReadSettings } from '@tamanu/settings';

import { buildSyncRoutes } from './sync';
import { attachmentRoutes } from './attachment';
import { facilityRoutes } from './facility';
import { healthRoutes } from './health';
import { integrationRoutes } from './integrations';
import { adminRoutes } from './admin';
import { suggestionsRoutes } from './suggestions';

export const buildRoutes = ctx => {
  const routes = express.Router();

  routes.get(
    '/settings/frontEnd',
    asyncHandler(async (req, res) => {
      req.flagPermissionChecked();
      const { facilityId } = z.object({ facilityId: z.string() }).parse(req.query);
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

  return routes;
};

import express from 'express';

import { adminRoutes } from './admin';
import { attachmentRoutes } from './attachment';
import { facilityRoutes } from './facility';
import { healthRoutes } from './health';
import { integrationRoutes } from './integrations';
import { buildSyncRoutes } from './sync';

export const buildRoutes = ctx => {
  const routes = express.Router();

  routes.use('/sync', buildSyncRoutes(ctx));
  routes.use('/attachment', attachmentRoutes);
  routes.use('/facility', facilityRoutes);
  routes.use('/health', healthRoutes);
  routes.use('/integration', integrationRoutes);
  routes.use('/admin', adminRoutes);

  return routes;
};

import express from 'express';

import { syncRoutes } from './sync';
import { attachmentRoutes } from './attachment';
import { healthRoutes } from './health';
import { integrationRoutes } from './integrations';
import { adminRoutes } from './admin';

export const routes = express.Router();

routes.use('/sync', syncRoutes);
routes.use('/attachment', attachmentRoutes);
routes.use('/health', healthRoutes);
routes.use('/integration', integrationRoutes);
routes.use('/admin', adminRoutes);

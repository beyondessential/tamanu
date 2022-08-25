import express from 'express';

import { syncRoutes } from './sync';
import { attachmentRoutes } from './attachment';
import { facilityRoutes } from './facility';
import { healthRoutes } from './health';
import { integrationRoutes } from './integrations';

export const routes = express.Router();

routes.use('/sync', syncRoutes);
routes.use('/attachment', attachmentRoutes);
routes.use('/facility', facilityRoutes);
routes.use('/health', healthRoutes);
routes.use('/integration', integrationRoutes);

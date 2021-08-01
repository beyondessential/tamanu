import express from 'express';

import { syncRoutes } from './sync';
import { attachmentRoutes } from './attachment';
import { healthRoutes } from './health';

export const routes = express.Router();

routes.use('/sync', syncRoutes);
routes.use('/attachment', attachmentRoutes);
routes.use('/health', healthRoutes);

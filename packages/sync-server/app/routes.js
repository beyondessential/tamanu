import express from 'express';

import { resetPassword, changePassword } from './auth';
import { syncRoutes } from './sync';
import { attachmentRoutes } from './attachment';

export const routes = express.Router();

routes.use('/sync', syncRoutes);
routes.use('/attachment', attachmentRoutes);

import express from 'express';

import { resetPassword } from './resetPassword';
import { changePassword } from './changePassword';
import { syncRoutes } from './sync';
import { attachmentRoutes } from './attachment';

export const routes = express.Router();

routes.use('/resetPassword', resetPassword);
routes.use('/changePassword', changePassword);

routes.use('/sync', syncRoutes);
routes.use('/attachment', attachmentRoutes);

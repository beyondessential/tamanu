import express from 'express';

import { syncRoutes } from './sync';
import { covidResultRoutes } from './covidResult';
import { attachmentRoutes } from './attachment';

export const routes = express.Router();

routes.use('/sync', syncRoutes);
routes.use('/attachment', attachmentRoutes);
routes.use('/covidResult', covidResultRoutes);

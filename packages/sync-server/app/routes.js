import express from 'express';

import { syncRoutes } from './sync';

export const routes = express.Router();

routes.use('/sync', syncRoutes);


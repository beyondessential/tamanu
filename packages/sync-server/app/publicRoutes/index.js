import express from 'express';

import { labResultWidgetRoutes } from './labResultWidget';

export const publicRoutes = express.Router();

publicRoutes.use('/labResultWidget', labResultWidgetRoutes);

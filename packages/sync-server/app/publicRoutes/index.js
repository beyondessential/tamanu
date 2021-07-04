import express from 'express';

import { labResultWidgetRoutes } from './labResultWidget';

export const publicRoutes = express.Router();

publicRoutes.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

publicRoutes.use('/labResultWidget', labResultWidgetRoutes);

import express from 'express';
import config from 'config';

import { labResultWidgetRoutes } from './labResultWidget';

export const publicRoutes = express.Router();

const { cors } = config;

if (cors.allowedOrigin) {
  publicRoutes.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", cors.allowedOrigin);
    next();
  });
}

publicRoutes.use('/labResultWidget', labResultWidgetRoutes);

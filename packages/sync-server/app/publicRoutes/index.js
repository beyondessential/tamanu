import express from 'express';
import config from 'config';
import { log } from '@tamanu/shared/services/logging';

import { labResultWidgetRoutes } from './labResultWidget';
import { publicIntegrationRoutes } from '../integrations';

export const publicRoutes = express.Router();

const { cors } = config;

if (cors.allowedOrigin) {
  publicRoutes.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', cors.allowedOrigin);
    next();
  });
} else {
  log.warn(
    'publicRoutes: CORS has not been set up for this server; external widgets like the COVID test results will be unavailable until cors.allowedOrigin is set to the appropriate domain',
  );
}

publicRoutes.use('/labResultWidget', labResultWidgetRoutes);
publicRoutes.use('/integration', publicIntegrationRoutes);

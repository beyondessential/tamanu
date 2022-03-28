import express from 'express';
import config from 'config';
import { log } from 'shared/services/logging';

import { labResultWidgetRoutes } from './labResultWidget';
import { publicIntegrationRoutes } from '../integrations';

export const publicRoutes = express.Router();

const { cors } = config;

if (cors.allowedOrigin || cors.allowedOrigins) {
  const allowedOrigins = cors.allowedOrigin ? [cors.allowedOrigin] : cors.allowedOrigins;
  publicRoutes.use((req, res, next) => {
    // if this is coming from an allowed origin, set the cors header to allow it
    const origin = req.get('origin');
    const allowedOrigin = allowedOrigins.find(o => o === origin);
    if (allowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    }
    next();
  });
} else {
  log.warn(
    'publicRoutes: CORS has not been set up for this server; external widgets like the COVID test results will be unavailable until cors.allowedOrigin is set to the appropriate domain',
  );
}

publicRoutes.use('/labResultWidget', labResultWidgetRoutes);
publicRoutes.use('/integration', publicIntegrationRoutes);

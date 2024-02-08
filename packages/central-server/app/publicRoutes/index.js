import express from 'express';
import config from 'config';
import { log } from '@tamanu/shared/services/logging';

import { labResultWidgetRoutes } from './labResultWidget';
import { publicIntegrationRoutes } from '../integrations';

import { getLanguageOptions } from '@tamanu/shared/utils/translation/getLanguageOptions';
import { NOT_MODIFIED_STATUS_CODE } from '@tamanu/constants';

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

publicRoutes.get('/ping', (_req, res) => {
  res.send({ ok: true });
});

publicRoutes.use('/labResultWidget', labResultWidgetRoutes);
publicRoutes.use('/integration', publicIntegrationRoutes);
publicRoutes.get('/translation/preLogin', async (req, res) => {
  const response = await getLanguageOptions(req.models, req.headers['if-none-match']);
  if (response === NOT_MODIFIED_STATUS_CODE) {
    res.status(NOT_MODIFIED_STATUS_CODE).end();
    return;
  }
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('ETag', response.eTag);
  res.send(response.languageOptions);
});
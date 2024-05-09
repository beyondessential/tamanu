import express from 'express';
import config from 'config';
import { log } from '@tamanu/shared/services/logging';
import { keyBy, mapValues } from 'lodash';

import { labResultWidgetRoutes } from './labResultWidget';
import { publicIntegrationRoutes } from '../integrations';
import { telegramWebhookRoutes } from './telegramWebhook';

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

publicRoutes.get('/translation/languageOptions', async (req, res) => {
  const { TranslatedString } = req.models;
  const response = await TranslatedString.getPossibleLanguages();
  res.send(response);
});

publicRoutes.get('/translation/:language', async (req, res) => {
  const {
    models: { TranslatedString },
    params: { language },
  } = req;

  const translatedStringRecords = await TranslatedString.findAll({
    where: { language },
    attributes: ['stringId', 'text'],
  });

  res.send(mapValues(keyBy(translatedStringRecords, 'stringId'), 'text'));
});

publicRoutes.use('/labResultWidget', labResultWidgetRoutes);
publicRoutes.use('/integration', publicIntegrationRoutes);

publicRoutes.use('/telegram-webhook', telegramWebhookRoutes);

import express from 'express';
import asyncHandler from 'express-async-handler';
import { ReadSettings } from '@tamanu/settings';
import { getCurrentBrowserMajors } from '@tamanu/shared/utils/browserSupportVersions';
import { decideBrowserSupport, parseBrowserDescriptor } from '@tamanu/utils/browserSupport';
import { keyBy, mapValues } from 'es-toolkit/compat';

import { labResultWidgetRoutes } from './labResultWidget';
import { publicIntegrationRoutes } from '../integrations';
import { telegramWebhookRoutes } from './telegramWebhook';

export const publicRoutes = express.Router();

// Without cors.allowedOrigin set, external widgets like the COVID test results
// are unavailable to browsers on other domains.
publicRoutes.use(
  asyncHandler(async (req, res, next) => {
    const allowedOrigin = await req.settings.get('security.cors.allowedOrigin');
    if (allowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    }
    next();
  }),
);

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

publicRoutes.post('/browser-support', async (req, res) => {
  // Pre-login gate for the admin panel; the client posts its parsed navigator info.
  const settings = new ReadSettings(req.models);
  const [policy, versionsBack, platformPolicy] = await Promise.all([
    settings.get('browserSupport.policy'),
    settings.get('browserSupport.versionsBack'),
    settings.get('browserSupport.platform'),
  ]);
  res.send(
    decideBrowserSupport({
      policy,
      versionsBack,
      platformPolicy,
      currentMajors: getCurrentBrowserMajors(),
      descriptor: parseBrowserDescriptor(req.body),
    }),
  );
});

publicRoutes.use('/labResultWidget', labResultWidgetRoutes);
publicRoutes.use('/integration', publicIntegrationRoutes);

publicRoutes.use('/telegram-webhook', telegramWebhookRoutes);

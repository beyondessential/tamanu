import express from 'express';
import asyncHandler from 'express-async-handler';
import { ReadSettings } from '@tamanu/settings';
import { getCurrentBrowserMajors } from '@tamanu/shared/utils/browserSupportVersions';
import { decideBrowserSupport, parseBrowserDescriptor } from '@tamanu/utils/browserSupport';

import { labResultWidgetRoutes } from './labResultWidget';
import { publicIntegrationRoutes } from '../integrations';
import { telegramWebhookRoutes } from './telegramWebhook';
import { getLanguageOptions, getTranslations } from './translation';

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

publicRoutes.get('/translation/languageOptions', getLanguageOptions);
publicRoutes.get('/translation/:language', getTranslations);

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

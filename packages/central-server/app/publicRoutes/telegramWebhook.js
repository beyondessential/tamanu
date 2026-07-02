import express from 'express';
import asyncHandler from 'express-async-handler';
import config from 'config';
import { log } from '@tamanu/shared/services/logging';
import { getSettingSecret, SecretNotConfiguredError } from '@tamanu/shared/utils/crypto';

export const telegramWebhookRoutes = express.Router();

telegramWebhookRoutes.post(
  `/`,
  asyncHandler(async (req, res) => {
    log.info('Received telegram webhook', req.body);
    let webhookSecret;
    try {
      webhookSecret = await getSettingSecret(req.ctx.settings, 'integrations.telegram.webhook.secret');
    } catch (e) {
      if (!(e instanceof SecretNotConfiguredError)) throw e;
      // transitional: legacy config value until the secret is set via the admin UI
      webhookSecret = config.telegramBot?.webhook?.secret;
    }
    if (!webhookSecret || req.header('X-Telegram-Bot-Api-Secret-Token') !== webhookSecret)
      return res.status(401).send('Invalid token');

    req.ctx.telegramBotService?.update(req.body);
    res.sendStatus(200);
  }),
);

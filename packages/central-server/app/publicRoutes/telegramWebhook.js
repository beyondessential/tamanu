import express from 'express';
import asyncHandler from 'express-async-handler';
import { log } from '@tamanu/shared/services/logging';
import { getOptionalSettingSecret } from '@tamanu/shared/utils/crypto';

export const telegramWebhookRoutes = express.Router();

telegramWebhookRoutes.post(
  `/`,
  asyncHandler(async (req, res) => {
    log.info('Received telegram webhook', req.body);
    const webhookSecret = await getOptionalSettingSecret(
      req.ctx.settings,
      'integrations.telegram.webhook.secret',
    );
    if (!webhookSecret || req.header('X-Telegram-Bot-Api-Secret-Token') !== webhookSecret)
      return res.status(401).send('Invalid token');

    req.ctx.telegramBotService?.update(req.body);
    res.sendStatus(200);
  }),
);

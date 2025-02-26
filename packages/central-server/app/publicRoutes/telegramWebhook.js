import express from 'express';
import asyncHandler from 'express-async-handler';
import config from 'config';
import { log } from '@tamanu/shared/services/logging';

export const telegramWebhookRoutes = express.Router();

telegramWebhookRoutes.post(
  `/`,
  asyncHandler(async (req, res) => {
    log.info('Received telegram webhook', req.body);
    if (req.header('X-Telegram-Bot-Api-Secret-Token') !== config.telegramBot?.webhook.secret)
      return res.status(401).send('Invalid token');

    req.ctx.telegramBotService?.update(req.body);
    res.sendStatus(200);
  }),
);

import express from 'express';
import asyncHandler from 'express-async-handler';
import { log } from '@tamanu/shared/services/logging';

export const telegramWebhookRoutes = express.Router();

telegramWebhookRoutes.post(
  `/`,
  asyncHandler(async (req, res) => {
    log.info('Received telegram webhook', req.body);
    // Reject when no secret is configured — otherwise an empty token header would
    // match an empty fallback and bypass auth on a misconfigured server.
    const webhookSecret = await req.ctx.settings.get('telegramBot.webhook.secret');
    if (!webhookSecret || req.header('X-Telegram-Bot-Api-Secret-Token') !== webhookSecret)
      return res.status(401).send('Invalid token');

    req.ctx.telegramBotService?.update(req.body);
    res.sendStatus(200);
  }),
);

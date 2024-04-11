import express from 'express';
import asyncHandler from 'express-async-handler';
import config from 'config';

export const telegramWebhookRoutes = express.Router();

telegramWebhookRoutes.post(
  `/`,
  asyncHandler(async (req, res) => {
    const secretToken = config.telegramBot?.secretToken;
    if (req.header('X-Telegram-Bot-Api-Secret-Token') !== secretToken) {
      return res.status(401).send('Invalid token');
    }
    req.ctx.telegramBotService.processUpdate(req.body);
    res.sendStatus(200);
  }),
);

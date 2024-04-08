import express from 'express';
import asyncHandler from 'express-async-handler';
import config from 'config';
import { TelegramBotService } from '../services/TelegramBotService';

export const telegramWebhookRoutes = express.Router();

telegramWebhookRoutes.post(
  `/`,
  asyncHandler(async (req, res) => {
    const tgBot = new TelegramBotService(req.ctx, { autoStartWebhook: true });
    tgBot.initListener();
    const secretToken = config.telegramBot?.secretToken;
    if (req.header('X-Telegram-Bot-Api-Secret-Token') !== secretToken) {
      return res.status(401).send('Invalid token');
    }
    tgBot.processUpdate(req.body);
    res.sendStatus(200);
  }),
);

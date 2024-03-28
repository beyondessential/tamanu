import express from 'express';
import asyncHandler from 'express-async-handler';
import config from 'config';
import { TelegramBotService } from '../services/TelegramBotService';

export const telegramWebhookRoutes = express.Router();

const tgBot = new TelegramBotService({ autoStartWebhook: true });

telegramWebhookRoutes.post(
  `/`,
  asyncHandler(async (req, res) => {
    const secretToken = config.telegramBot?.secretToken;
    if (req.header('X-Telegram-Bot-Api-Secret-Token') !== secretToken) {
      return res.status(401).send('Invalid token');
    }
    tgBot.processUpdate(req.body);
    res.sendStatus(200);
  }),
);

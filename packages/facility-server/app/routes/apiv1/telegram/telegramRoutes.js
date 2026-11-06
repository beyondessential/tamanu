import express from 'express';

import expressAsyncHandler from 'express-async-handler';

import { WS_EVENTS } from '@tamanu/constants';

import { wakeCentral } from '../../../utils/wakeCentral';

export const telegramRoutes = express.Router();

// Central may need to wake up and start before it can answer
export const TELEGRAM_BOT_INFO_TIMEOUT_MS = 30_000;

/**
 *
 * @param {ReturnType<import('../../../services/websocketClientService').defineWebsocketClientService>} ws
 */
export const getTelegramBotInfo = async ws => {
  return await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      ws?.removeListener(WS_EVENTS.TELEGRAM_BOT_INFO, onBotInfo);
      reject(new Error('Timed out waiting for the Telegram bot information from central'));
    }, TELEGRAM_BOT_INFO_TIMEOUT_MS);

    const onBotInfo = botInfo => {
      clearTimeout(timeout);
      resolve(botInfo);
    };

    try {
      ws?.listenOnce(WS_EVENTS.TELEGRAM_BOT_INFO, onBotInfo);
      ws?.emit(WS_EVENTS.TELEGRAM_GET_BOT_INFO);
    } catch (e) {
      clearTimeout(timeout);
      reject(e);
    }
  });
};

telegramRoutes.get(
  '/bot-info',
  expressAsyncHandler(async (req, res) => {
    req.flagPermissionChecked();
    await wakeCentral(req.deviceId);
    const botInfo = await getTelegramBotInfo(req?.websocketClientService);
    res.send(botInfo);
  }),
);

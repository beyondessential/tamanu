import express from 'express';

import expressAsyncHandler from 'express-async-handler';

import { WS_EVENTS } from '@tamanu/constants';

export const telegramRoutes = express.Router();

/**
 *
 * @param {ReturnType<import('../../../services/websocketClientService').defineWebsocketClientService>} ws
 */
const getTelegramBotInfo = async ws => {
  return await new Promise((resolve, reject) => {
    try {
      ws?.emit(WS_EVENTS.TELEGRAM_GET_BOT_INFO);
      ws?.listenOnce(WS_EVENTS.TELEGRAM_BOT_INFO, botInfo => resolve(botInfo));
    } catch (e) {
      reject(e);
    }
  });
};

telegramRoutes.get(
  '/bot-info',
  expressAsyncHandler(async (req, res) => {
    req.flagPermissionChecked();
    const botInfo = await getTelegramBotInfo(req?.websocketClientService);
    res.send(botInfo);
  }),
);

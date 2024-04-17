import express from 'express';

import expressAsyncHandler from 'express-async-handler';

export const telegramRoutes = express.Router();

/**
 *
 * @param {ReturnType<import('../../../services/websocketClientService').defineWebsocketClientService>} ws
 */
const getTelegramBotInfo = async ws => {
  return await new Promise((resolve, reject) => {
    try {
      ws.emit('telegram:get-bot-info');
      ws.listenOnce('telegram:bot-info', botInfo => resolve(botInfo));
    } catch (e) {
      reject(e);
    }
  });
};

telegramRoutes.get(
  '/bot-info',
  expressAsyncHandler(async (req, res) => {
    req.flagPermissionChecked();
    const botInfo = await getTelegramBotInfo(req.websocketClientService);
    res.send(botInfo);
  }),
);

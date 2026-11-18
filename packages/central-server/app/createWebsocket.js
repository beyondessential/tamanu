import { defineWebsocketService } from './services/websocketService';
import { registerWebsocketEvents } from './wsEvents';

/**
 * @param {import('http').Server} server
 * @param {import('./ApplicationContext').ApplicationContext} ctx
 * @param {import('express').Express} app
 */
export async function createWebsocket(server, ctx, app) {
  const { store } = ctx;

  const websocketService = await defineWebsocketService({
    httpServer: server,
    sequelize: store.sequelize,
    models: store.models,
    app,
  });

  ctx.telegramBotService?.registerWebsocketService(websocketService);

  registerWebsocketEvents({
    websocketService,
    telegramBotService: ctx.telegramBotService,
    models: store.models,
  });

  return { websocketService };
}

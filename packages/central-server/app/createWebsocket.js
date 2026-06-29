import { defineWebsocketService } from './services/websocketService';
import { registerWebsocketEvents } from './wsEvents';

/**
 * @param {import('http').Server} server
 * @param {import('./ApplicationContext').ApplicationContext} ctx
 * @param {Awaited<ReturnType<import('@tamanu/shared/services/dbNotifier').defineDbNotifier>>} dbNotifier
 * @param {import('express').Express} app
 */
export async function createWebsocket(server, ctx, dbNotifier, app) {
  const { store } = ctx;

  const websocketService = await defineWebsocketService({
    httpServer: server,
    sequelize: store.sequelize,
    models: store.models,
    app,
    dbNotifier,
  });

  ctx.telegramBotService?.registerWebsocketService(websocketService);

  registerWebsocketEvents({
    websocketService,
    telegramBotService: ctx.telegramBotService,
    models: store.models,
  });

  return { websocketService };
}

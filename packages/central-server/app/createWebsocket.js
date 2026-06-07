import { defineWebsocketService } from './services/websocketService';
import { registerWebsocketEvents } from './wsEvents';

/**
 * @param {import('http').Server} server
 * @param {import('./ApplicationContext').ApplicationContext} ctx
 * @param {Awaited<ReturnType<import('@tamanu/shared/services/dbNotifier').defineDbNotifier>>} dbNotifier
 */
export async function createWebsocket(server, ctx, dbNotifier) {
  const { store } = ctx;

  const websocketService = await defineWebsocketService({
    httpServer: server,
    sequelize: store.sequelize,
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

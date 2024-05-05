import { defineWebsocketService } from './services/websocketService';
import { registerWebsocketEvents } from './wsEvents';

/**
 * @param {import('http').Server} server
 * @param {import('./ApplicationContext').ApplicationContext} ctx
 */
export async function createWebsocket(server, ctx) {
  const { store } = ctx;

  const websocketService = defineWebsocketService({ httpServer: server });

  ctx.telegramBotService?.registerWebsocketService(websocketService);

  registerWebsocketEvents({
    websocketService,
    telegramBotService: ctx.telegramBotService,
    models: store.models,
  });

  return { websocketService };
}

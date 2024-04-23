import config from 'config';

import { defineWebsocketService } from './services/websocketService';
import { defineWebsocketClientService } from './services/websocketClientService';

/**
 * @param {import('http').Server} server
 * @param {import('./ApplicationContext').ApplicationContext} ctx
 */
export async function createWebsocket(server, ctx) {
  const websocketService = defineWebsocketService({ httpServer: server });
  const websocketClientService = defineWebsocketClientService({
    config,
    websocketService,
    models: ctx.models,
  });

  return { websocketService, websocketClientService };
}

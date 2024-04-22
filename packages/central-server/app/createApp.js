import { createApi } from './createApi';
import { createWebsocket } from './createWebsocket';

/**
 * @param {import('./ApplicationContext').ApplicationContext} ctx
 */
export async function createApp(ctx) {
  const api = await createApi(ctx);
  const websocket = await createWebsocket(api.httpServer, ctx);

  return { express: api.express, server: api.httpServer, websocket };
}

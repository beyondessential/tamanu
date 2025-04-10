import { createApi } from './createApi';
import { createWebsocket } from './createWebsocket';
import config from 'config';

/**
 * @param {import('./ApplicationContext').ApplicationContext} ctx
 */
export async function createApp(ctx) {
  const api = await createApi(ctx);

  if (config['socket.io'].enabled) {
    await createWebsocket(api.httpServer, ctx);
  }

  return { express: api.express, server: api.httpServer };
}

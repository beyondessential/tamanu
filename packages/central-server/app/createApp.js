import { createApi } from './createApi';
import { createWebsocket } from './createWebsocket';

/**
 * @param {import('./ApplicationContext').ApplicationContext} ctx
 */
export async function createApp(ctx) {
  const api = await createApi(ctx);
  const websocket = await createWebsocket(api.httpServer, ctx);
  setInterval(() => {
    console.log('Hello, this is central server!');
  }, 5000);

  return { express: api.express, server: api.httpServer, websocket };
}

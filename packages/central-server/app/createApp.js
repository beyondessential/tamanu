import config from 'config';
import { defineDbNotifier } from '@tamanu/shared/services/dbNotifier';
import { NOTIFY_CHANNELS } from '@tamanu/constants';

import { createApi } from './createApi';
import { createWebsocket } from './createWebsocket';
import { registerSyncLookupUpdateListener } from './sync';

/**
 * @param {import('./ApplicationContext').ApplicationContext} ctx
 */
export async function createApp(ctx) {
  const api = await createApi(ctx);

  const dbNotifier = await defineDbNotifier(ctx.store.sequelize.config, [
    NOTIFY_CHANNELS.TABLE_CHANGED,
  ]);
  await registerSyncLookupUpdateListener(ctx.store.models, dbNotifier);

  if (config["socket.io"].enabled) {
    await createWebsocket(api.httpServer, ctx);
  }

  // Release the connection back to the pool when the server is closed
  api.httpServer.on('close', () => {
    dbNotifier.close();
  });

  return { express: api.express, server: api.httpServer };
}

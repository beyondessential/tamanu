import config from 'config';
import { defineDbNotifier } from '@tamanu/shared/services/dbNotifier';
import { NOTIFY_CHANNELS } from '@tamanu/constants';
import { registerSettingsCacheInvalidator } from '@tamanu/settings/cache';
import { log } from '@tamanu/shared/services/logging';

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
  registerSettingsCacheInvalidator(dbNotifier.listeners[NOTIFY_CHANNELS.TABLE_CHANGED]);
  dbNotifier.listeners[NOTIFY_CHANNELS.TABLE_CHANGED](async payload => {
    if (payload.table !== 'settings') return;
    try {
      await ctx.aiService?.registerFormBuilderContext(ctx.settings);
    } catch (error) {
      log.warn({ error }, 'Failed to refresh AI form builder contexts after settings change');
    }
  });

  if (config["socket.io"].enabled) {
    await createWebsocket(api.httpServer, ctx, dbNotifier);
  }

  // Release the connection back to the pool when the server is closed
  api.httpServer.on('close', () => {
    dbNotifier.close();
  });

  return { express: api.express, server: api.httpServer };
}

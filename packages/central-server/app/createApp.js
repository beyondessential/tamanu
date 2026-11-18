import { defineDbNotifier, exitOnDatabaseOutage } from '@tamanu/shared/services/dbNotifier';
import { NOTIFY_CHANNELS } from '@tamanu/constants';

import { createApi } from './createApi';
import { createWebsocket } from './createWebsocket';
import { registerSyncLookupUpdateListener } from './sync';
import { registerSettingsListeners } from './settingsListeners';

/**
 * @param {import('./ApplicationContext').ApplicationContext} ctx
 */
export async function createApp(ctx) {
  const api = await createApi(ctx);

  const dbNotifier = await defineDbNotifier(
    ctx.store.sequelize.config,
    [NOTIFY_CHANNELS.TABLE_CHANGED],
    { onOutageExceeded: exitOnDatabaseOutage },
  );
  await registerSyncLookupUpdateListener(ctx.store.models, dbNotifier);
  registerSettingsListeners(ctx, dbNotifier.listeners[NOTIFY_CHANNELS.TABLE_CHANGED], {
    onReconnect: dbNotifier.onReconnect,
  });

  if (await ctx.settings.get('websocket.enabled')) {
    await createWebsocket(api.httpServer, ctx, dbNotifier, api.express);
  }

  // Release the connection back to the pool when the server is closed
  api.httpServer.on('close', () => {
    dbNotifier.close();
  });

  return { express: api.express, server: api.httpServer };
}

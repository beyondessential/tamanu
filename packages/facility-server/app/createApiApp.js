import config from 'config';
import defineExpress from 'express';
import helmet from 'helmet';

import { settingsReaderMiddleware } from '@tamanu/settings/middleware';
import { registerSettingsCacheInvalidator } from '@tamanu/settings/cache';
import { defineDbNotifier } from '@tamanu/shared/services/dbNotifier';
import { buildRateLimiters } from '@tamanu/shared/utils/rateLimit';
import { NOTIFY_CHANNELS } from '@tamanu/constants';

import { createRoutes } from './routes';
import errorHandler from './middleware/errorHandler';
import { versionCompatibility } from './middleware/versionCompatibility';

import { createServer } from 'http';
import { defineWebsocketService } from './services/websocketService';
import { defineWebsocketClientService } from './services/websocketClientService';
import { addFacilityMiddleware } from './addFacilityMiddleware';

/**
 * @param {import('./ApplicationContext').ApplicationContext} ctx
 */
export async function createApiApp({
  sequelize,
  reportSchemaStores,
  models,
  syncConnection,
  deviceId,
}) {
  const express = defineExpress();
  // Match Express 4 query parsing (qs) — Express 5 defaults to "simple" and does
  // not parse bracket/array query keys into nested objects.
  express.set('query parser', 'extended');
  const server = createServer(express);

  const dbNotifier = await defineDbNotifier(sequelize.config, [
    NOTIFY_CHANNELS.TABLE_CHANGED,
    NOTIFY_CHANNELS.MATERIALIZED_VIEW_REFRESHED,
  ]);

  registerSettingsCacheInvalidator(dbNotifier.listeners[NOTIFY_CHANNELS.TABLE_CHANGED]);

  const websocketService = defineWebsocketService({ httpServer: server, dbNotifier, models });
  const websocketClientService = defineWebsocketClientService({ config, websocketService, models });

  express.use(
    helmet({
      crossOriginEmbedderPolicy: true,
      strictTransportSecurity: false,
    }),
  );
  const { errorMiddleware } = addFacilityMiddleware(express);

  // Release the connection back to the pool when the server is closed
  server.on('close', () => {
    dbNotifier.close();
  });

  express.use((req, res, next) => {
    req.models = models;
    req.db = sequelize;
    req.reportSchemaStores = reportSchemaStores;
    req.syncConnection = syncConnection;
    req.deviceId = deviceId;
    req.language = req.headers['language'];
    req.websocketService = websocketService;
    req.websocketClientService = websocketClientService;
    req.dbNotifier = dbNotifier;

    next();
  });

  express.use(versionCompatibility);

  express.use(settingsReaderMiddleware);

  // index route for debugging connectivity
  express.get('/', (req, res) => {
    res.send({
      index: true,
    });
  });

  const limiters = buildRateLimiters();
  // Apply a permissive global rate limit to every API request as a
  // denial-of-service backstop. Stricter per-endpoint limits for unauthenticated
  // endpoints are applied inside routes/apiv1 (via createRoutes) so they cover
  // both /api and /v1. Single buildRateLimiters() call avoids duplicate
  // MemoryStores and cleanup intervals.
  express.use('/', limiters.globalLimiter);
  express.use('/', createRoutes(limiters));

  // Dis-allow all other routes
  express.get('/{*splat}', (req, res) => {
    res.status(404).end();
  });

  if (errorMiddleware) {
    express.use(errorMiddleware);
  }
  express.use(errorHandler);

  return {
    express,
    server,
  };
}

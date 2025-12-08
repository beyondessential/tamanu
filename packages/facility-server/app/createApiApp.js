import config from 'config';
import defineExpress from 'express';
import helmet from 'helmet';

import { settingsReaderMiddleware } from '@tamanu/settings/middleware';
import { defineDbNotifier } from '@tamanu/shared/services/dbNotifier';
import { NOTIFY_CHANNELS } from '@tamanu/constants';

import routes from './routes';
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
  const server = createServer(express);

  const dbNotifier = await defineDbNotifier(sequelize.config, [
    NOTIFY_CHANNELS.TABLE_CHANGED,
    NOTIFY_CHANNELS.MATERIALIZED_VIEW_REFRESHED,
  ]);

  let websocketService = null;
  let websocketClientService = null;

  if (config['socket.io'].enabled) {
    websocketService = defineWebsocketService({ httpServer: server, dbNotifier, models });
    websocketClientService = defineWebsocketClientService({ config, websocketService, models });
  }

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
  express.get('/$', (req, res) => {
    res.send({
      index: true,
    });
  });

  express.use('/', routes);

  // Dis-allow all other routes
  express.get('*', (req, res) => {
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

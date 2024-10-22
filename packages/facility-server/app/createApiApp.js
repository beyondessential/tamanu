import config from 'config';
import defineExpress from 'express';

import { settingsReaderMiddleware } from '@tamanu/settings/middleware';
import { getAuditMiddleware } from './middleware/auditLog';

import routes from './routes';
import errorHandler from './middleware/errorHandler';
import { versionCompatibility } from './middleware/versionCompatibility';

import { createServer } from 'http';
import { defineWebsocketService } from './services/websocketService';
import { defineWebsocketClientService } from './services/websocketClientService';
import { addFacilityMiddleware } from './addFacilityMiddleware';
import { defineDbNotifier } from './services/dbNotifier';

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

  const dbNotifier = await defineDbNotifier({
    host: sequelize.config.host,
    port: sequelize.config.port,
    database: sequelize.config.database,
    user: sequelize.config.user,
    password: sequelize.config.password,
  });
  const websocketService = defineWebsocketService({ httpServer: server, dbNotifier });
  const websocketClientService = defineWebsocketClientService({ config, websocketService, models });

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

  express.use(getAuditMiddleware());

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

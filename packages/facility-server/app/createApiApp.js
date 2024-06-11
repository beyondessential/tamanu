import config from 'config';
import defineExpress from 'express';

import { buildSettingsReaderMiddleware } from '@tamanu/settings/middleware';
import { getAuditMiddleware } from './middleware/auditLog';

import routes from './routes';
import errorHandler from './middleware/errorHandler';
import { versionCompatibility } from './middleware/versionCompatibility';

import { createServer } from 'http';
import { defineWebsocketService } from './services/websocketService';
import { defineWebsocketClientService } from './services/websocketClientService';
import { addFacilityMiddleware } from './addFacilityMiddleware';

export async function createApiApp({ sequelize, reportSchemaStores, models, syncConnection, deviceId }) {
  const express = defineExpress();
  const server = createServer(express);

  const websocketService = defineWebsocketService({ httpServer: server });
  const websocketClientService = defineWebsocketClientService({ config, websocketService, models });

  const { errorMiddleware } = addFacilityMiddleware(express);

  express.use((req, res, next) => {
    req.models = models;
    req.db = sequelize;
    req.reportSchemaStores = reportSchemaStores;
    req.syncConnection = syncConnection;
    req.deviceId = deviceId;
    req.websocketService = websocketService;
    req.websocketClientService = websocketClientService;

    next();
  });

  express.use(buildSettingsReaderMiddleware(config.serverFacilityId));
  express.use(versionCompatibility);

  express.use(getAuditMiddleware());

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

  return { express, server };
}

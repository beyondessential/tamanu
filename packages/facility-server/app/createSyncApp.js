import defineExpress from 'express';

import errorHandler from './middleware/errorHandler';
import { createServer } from 'http';
import syncRoutes from './routes/sync';
import { addExpressMiddleware } from './addExpressMiddleware';

export async function createSyncApp({ sequelize, reportSchemaStores, syncManager, models, deviceId }) {
  const express = defineExpress();
  const server = createServer(express);

  const { errorMiddleware } = addExpressMiddleware(express);

  express.use((req, res, next) => {
    req.models = models;
    req.db = sequelize;
    req.reportSchemaStores = reportSchemaStores;
    req.syncManager = syncManager;
    req.deviceId = deviceId;

    next();
  });

  // index route for debugging connectivity
  express.get('/$', (req, res) => {
    res.send({
      index: true,
    });
  });

  express.use('/', syncRoutes);

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

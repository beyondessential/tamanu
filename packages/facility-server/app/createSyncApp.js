import defineExpress from 'express';
import helmet from 'helmet';

import errorHandler from './middleware/errorHandler';
import { createServer } from 'http';
import { addFacilityMiddleware } from './addFacilityMiddleware';
import { sync as syncRoutes } from './routes/sync/sync';

export async function createSyncApp({ sequelize, syncManager, models, deviceId }) {
  const express = defineExpress();
  const server = createServer(express);

  express.use(
    helmet({
      crossOriginEmbedderPolicy: true,
      strictTransportSecurity: false,
    }),
  );
  const { errorMiddleware } = addFacilityMiddleware(express);

  express.use((req, res, next) => {
    req.models = models;
    req.db = sequelize;
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

  // Only contain sync routes in this app
  express.use('/sync', syncRoutes);

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

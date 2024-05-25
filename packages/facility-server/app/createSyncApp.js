import bodyParser from 'body-parser';
import compression from 'compression';
import config from 'config';
import defineExpress from 'express';

import { SERVER_TYPES } from '@tamanu/constants';
import { getLoggingMiddleware } from '@tamanu/shared/services/logging';
import { buildSettingsReaderMiddleware } from '@tamanu/settings/middleware';
import { getAuditMiddleware } from './middleware/auditLog';

import errorHandler from './middleware/errorHandler';
import { versionCompatibility } from './middleware/versionCompatibility';

import { version } from './serverInfo';
import { createServer } from 'http';
import syncRoutes from './routes/sync';

export async function createSyncApp({ sequelize, reportSchemaStores, syncManager, models, deviceId }) {
  const express = defineExpress();
  const server = createServer(express);

  let errorMiddleware = null;
  if (config.errors?.enabled) {
    if (config.errors?.type === 'bugsnag') {
      const Bugsnag = await import('@bugsnag/js');
      const middleware = Bugsnag.getPlugin('express');
      express.use(middleware.requestHandler);
      errorMiddleware = middleware.errorHandler;
    }
  }

  express.use(compression());
  express.use(bodyParser.json({ limit: '50mb' }));
  express.use(bodyParser.urlencoded({ extended: true }));

  express.use((_req, res, next) => {
    res.setHeader('X-Tamanu-Server', SERVER_TYPES.FACILITY);
    res.setHeader('X-Version', version);
    next();
  });

  // trust the x-forwarded-for header from addresses in `config.proxy.trusted`
  express.set('trust proxy', config.proxy.trusted);
  express.use(getLoggingMiddleware());

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

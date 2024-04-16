import bodyParser from 'body-parser';
import compression from 'compression';
import config from 'config';
import express from 'express';

import { SERVER_TYPES } from '@tamanu/constants';
import { getLoggingMiddleware } from '@tamanu/shared/services/logging';
import { getAuditMiddleware } from './middleware/auditLog';

import routes from './routes';
import errorHandler from './middleware/errorHandler';
import { versionCompatibility } from './middleware/versionCompatibility';

import { version } from './serverInfo';

export async function createApp({ sequelize, reportSchemaStores, models, syncManager, deviceId }) {
  const app = express();

  let errorMiddleware = null;
  if (config.errors?.enabled) {
    if (config.errors?.type === 'bugsnag') {
      const Bugsnag = await import('@bugsnag/js');
      const middleware = Bugsnag.getPlugin('express');
      app.use(middleware.requestHandler);
      errorMiddleware = middleware.errorHandler;
    }
  }

  app.use(compression());
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    res.setHeader('X-Tamanu-Server', SERVER_TYPES.FACILITY);
    res.setHeader('X-Version', version);
    next();
  });

  // trust the x-forwarded-for header from addresses in `config.proxy.trusted`
  app.set('trust proxy', config.proxy.trusted);
  app.use(getLoggingMiddleware());

  app.use((req, res, next) => {
    req.models = models;
    req.db = sequelize;
    req.reportSchemaStores = reportSchemaStores;
    req.syncManager = syncManager;
    req.deviceId = deviceId;
    req.language = req.headers['language'];

    next();
  });

  app.use(versionCompatibility);

  app.use(getAuditMiddleware());

  // index route for debugging connectivity
  app.get('/$', (req, res) => {
    res.send({
      index: true,
    });
  });

  app.use('/', routes);

  // Dis-allow all other routes
  app.get('*', (req, res) => {
    res.status(404).end();
  });

  if (errorMiddleware) {
    app.use(errorMiddleware);
  }

  app.use(errorHandler);

  return app;
}

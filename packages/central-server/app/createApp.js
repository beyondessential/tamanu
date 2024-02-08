import bodyParser from 'body-parser';
import compression from 'compression';
import config from 'config';
import express from 'express';

import { getLoggingMiddleware } from '@tamanu/shared/services/logging';
import { constructPermission } from '@tamanu/shared/permissions/middleware';
import { SERVER_TYPES } from '@tamanu/constants';

import { buildRoutes } from './buildRoutes';
import { authModule } from './auth';
import { publicRoutes } from './publicRoutes';

import { defaultErrorHandler } from './middleware/errorHandler';
import { loadshedder } from './middleware/loadshedder';
import { versionCompatibility } from './middleware/versionCompatibility';

import { version } from './serverInfo';

function api(ctx) {
  const apiRoutes = express.Router();
  apiRoutes.use('/public', publicRoutes);
  apiRoutes.use(authModule);
  apiRoutes.use(constructPermission);
  apiRoutes.use(buildRoutes(ctx));
  return apiRoutes;
}

export function createApp(ctx) {
  const { store, emailService, reportSchemaStores } = ctx;

  // Init our app
  const app = express();
  app.use(loadshedder());
  app.use(compression());
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));

  // trust the x-forwarded-for header from addresses in `config.proxy.trusted`
  app.set('trust proxy', config.proxy.trusted);
  app.use(getLoggingMiddleware());

  app.use((req, res, next) => {
    res.setHeader('X-Tamanu-Server', SERVER_TYPES.CENTRAL);
    res.setHeader('X-Version', version);
    next();
  });

  app.use(versionCompatibility);

  app.use((req, res, next) => {
    req.models = store.models; // cross-compatibility with facility for shared middleware
    req.store = store;
    req.models = store.models;
    req.emailService = emailService;
    req.reportSchemaStores = reportSchemaStores;
    req.ctx = ctx;
    next();
  });

  app.get('/$', (req, res) => {
    res.send({
      index: true,
    });
  });

  // API
  app.use('/api', api(ctx));

  // Legacy API endpoint
  app.use('/v1', api(ctx));

  // Dis-allow all other routes
  app.use('*', (req, res) => {
    res.status(404).end();
  });

  app.use(defaultErrorHandler);

  return app;
}

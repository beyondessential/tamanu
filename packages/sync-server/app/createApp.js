import bodyParser from 'body-parser';
import compression from 'compression';
import config from 'config';
import express from 'express';
import path from 'path';

import { getLoggingMiddleware } from 'shared/services/logging';
import { constructPermission } from '@tamanu/shared/permissions/middleware';
import { SERVER_TYPES } from '@tamanu/constants';

import { buildRoutes } from './buildRoutes';
import { authModule } from './auth';
import { publicRoutes } from './publicRoutes';

import { defaultErrorHandler } from './middleware/errorHandler';
import { loadshedder } from './middleware/loadshedder';
import { versionCompatibility } from './middleware/versionCompatibility';

import { version } from './serverInfo';

export function createApp(ctx) {
  const { store, emailService } = ctx;

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
    res.setHeader('X-Tamanu-Server', SERVER_TYPES.SYNC);
    res.setHeader('X-Version', version);
    next();
  });

  app.use(versionCompatibility);

  app.use((req, res, next) => {
    req.models = store.models; // cross-compatibility with lan for shared middleware
    req.store = store;
    req.models = store.models;
    req.emailService = emailService;
    req.ctx = ctx;

    next();
  });

  // TODO: serve index page
  app.get('/$', (req, res) => {
    res.send({
      index: true,
    });
  });

  // API v1
  app.use('/v1/public', publicRoutes);
  app.use('/v1', authModule);
  app.use('/v1', constructPermission);
  app.use('/v1', buildRoutes(ctx));

  // Serve the latest desktop in upgrade folder so that desktops with lower versions
  // can perform auto upgrade when pointing to this endpoint
  app.use('/upgrade', express.static(path.join(process.cwd(), 'upgrade')));

  // Dis-allow all other routes
  app.use('*', (req, res) => {
    res.status(404).end();
  });

  app.use(defaultErrorHandler);

  return app;
}

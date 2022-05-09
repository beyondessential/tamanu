import express from 'express';
import bodyParser from 'body-parser';
import compression from 'compression';

import { getLoggingMiddleware } from 'shared/services/logging';

import { constructPermission } from 'shared/permissions/middleware';
import { routes } from './routes';
import { authModule } from './auth';
import { publicRoutes } from './publicRoutes';

import { defaultErrorHandler } from './middleware/errorHandler';
import { loadshedder } from './middleware/loadshedder';
import { versionCompatibility } from './middleware/versionCompatibility';

import { version } from '../package.json';

export function createApp(ctx) {
  const { store, emailService } = ctx;

  // Init our app
  const app = express();
  app.use(loadshedder());
  app.use(compression());
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(getLoggingMiddleware());

  app.use((req, res, next) => {
    res.setHeader('X-Tamanu-Server', 'Tamanu Sync Server');
    res.setHeader('X-Version', version);
    next();
  });

  app.use(versionCompatibility);

  app.use((req, res, next) => {
    req.store = store;
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
  app.use('/v1', routes);

  // Dis-allow all other routes
  app.use('*', (req, res) => {
    res.status(404).end();
  });

  app.use(defaultErrorHandler);

  return app;
}

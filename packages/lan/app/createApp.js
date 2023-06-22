import bodyParser from 'body-parser';
import compression from 'compression';
import config from 'config';
import express from 'express';
import path from 'path';

import { SERVER_TYPES } from 'shared/constants';
import { getLoggingMiddleware } from 'shared/services/logging';

import routes from './routes';
import errorHandler from './middleware/errorHandler';
import { versionCompatibility } from './middleware/versionCompatibility';

import { version } from './serverInfo';

export function createApp({ sequelize, models, syncManager, deviceId }) {
  // Init our app
  const app = express();
  app.use(compression());
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    res.setHeader('X-Tamanu-Server', SERVER_TYPES.LAN);
    res.setHeader('X-Version', version);
    next();
  });

  // trust the x-forwarded-for header from addresses in `config.proxy.trusted`
  app.set('trust proxy', config.proxy.trusted);
  app.use(getLoggingMiddleware());

  app.use((req, res, next) => {
    req.models = models;
    req.db = sequelize;
    req.syncManager = syncManager;
    req.deviceId = deviceId;

    next();
  });

  app.use(versionCompatibility);

  // index route for debugging connectivity
  app.get('/$', (req, res) => {
    res.send({
      index: true,
    });
  });

  app.use('/', routes);

  // Serve the latest desktop in upgrade folder so that desktops with lower versions
  // can perform auto upgrade when pointing to this endpoint
  app.use('/upgrade', express.static(path.join(process.cwd(), 'upgrade')));

  // Dis-allow all other routes
  app.get('*', (req, res) => {
    res.status(404).end();
  });

  app.use(errorHandler);

  return app;
}

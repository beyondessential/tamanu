import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import compression from 'compression';
import { log } from 'shared/services/logging';

import routes from './routes';
import errorHandler from './middleware/errorHandler';
import { versionCompatibility } from './middleware/versionCompatibility';

import { version } from '../package.json';

const isDevelopment = process.env.NODE_ENV === 'development';
const tinyPlusIp = `:remote-addr :method :url :status :res[content-length] - :response-time ms`

export function createApp({ sequelize, models, syncManager }) {
  // Init our app
  const app = express();
  app.use(compression());
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    res.setHeader('X-Runtime', 'Tamanu LAN Server'); // TODO: deprecated
    res.setHeader('X-Tamanu-Server', 'Tamanu LAN Server');
    res.setHeader('X-Version', version);
    next();
  });

  app.use(
    morgan(isDevelopment ? 'dev' : tinyPlusIp, {
      stream: {
        write: message => log.info(message),
      },
    }),
  );

  app.use((req, res, next) => {
    req.models = models;
    req.db = sequelize;
    req.syncManager = syncManager;

    next();
  });

  // index route for debugging connectivity
  app.get('/$', (req, res) => {
    res.send({
      index: true,
    });
  });

  app.use(versionCompatibility);

  app.use('/', routes);

  // Dis-allow all other routes
  app.get('*', (req, res) => {
    res.status(404).end();
  });

  app.use(errorHandler);

  return app;
}

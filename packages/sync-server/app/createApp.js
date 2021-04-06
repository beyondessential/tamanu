import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import compression from 'compression';

import { log } from 'shared/services/logging';

import { routes } from './routes';
import { authMiddleware } from './middleware/auth';
import errorHandler from './middleware/errorHandler';
import { versionCompatibility } from './middleware/versionCompatibility';

import { version } from '../package.json';

const isDevelopment = process.env.NODE_ENV === 'development';

export function createApp({ store }) {
  // Init our app
  const app = express();
  app.use(compression());
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(
    morgan(isDevelopment ? 'dev' : 'tiny', {
      stream: {
        write: message => log.info(message),
      },
    }),
  );

  app.use((req, res, next) => {
    res.setHeader('X-Runtime', 'Tamanu Sync Server');
    res.setHeader('X-Version', version);
    next();
  });

  app.use(versionCompatibility);

  app.use((req, res, next) => {
    req.store = store;

    next();
  });

  // TODO: serve index page
  app.get('/$', (req, res) => {
    res.send({
      index: true,
    });
  });

  // API v1
  app.use('/v1', authMiddleware);
  app.use('/v1', routes);

  // Dis-allow all other routes
  app.get('*', (req, res) => {
    res.status(404).end();
  });

  app.use(errorHandler);

  return app;
}

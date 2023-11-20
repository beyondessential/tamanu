import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import compression from 'compression';

import { log } from '@tamanu/shared/services/logging';
import { SERVER_TYPES } from '@tamanu/constants';

import { versionRouter } from './versions';
import { serversRouter } from './servers';

import { version } from '../package.json';

const isDevelopment = process.env.NODE_ENV === 'development';
const tinyPlusIp = `:remote-addr :method :url :status :res[content-length] - :response-time ms`;

export function createApp() {
  // Init our app
  const app = express();
  app.use(compression());
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    // TODO: deprecated, remove when all servers have moved on
    res.setHeader('X-Runtime', SERVER_TYPES.META);

    res.setHeader('X-Tamanu-Server', SERVER_TYPES.META);
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

  app.use('/version', versionRouter);
  app.use('/servers', serversRouter);

  app.get('/', (_req, res) => {
    res.send({
      index: true,
    });
  });

  // Dis-allow all other routes
  app.get('*', (_req, res) => {
    res.status(404).end();
  });

  /* eslint-disable no-unused-vars */
  app.use((error, _req, res, _next) => {
    res.status(500).send({
      error: {
        message: error.message,
        ...error,
      },
    });
  });

  return app;
}

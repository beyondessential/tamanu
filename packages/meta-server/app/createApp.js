import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import compression from 'compression';

import { versionRouter } from './versions';
import { serversRouter } from './servers';
import { log } from './logging';

import { version } from '../package.json';

const isDevelopment = process.env.NODE_ENV === 'development';

export function createApp() {
  // Init our app
  const app = express();
  app.use(compression());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    res.setHeader('X-Runtime', 'Tamanu Metadata Server');
    res.setHeader('X-Version', version);
    next();
  });

  app.use(
    morgan(isDevelopment ? 'dev' : 'tiny', {
      stream: {
        write: message => log.info(message),
      },
    }),
  );

  app.use('/version', versionRouter);
  app.use('/servers', serversRouter);

  app.get('/', (req, res) => {
    res.send({
      index: true,
    });
  });

  // Dis-allow all other routes
  app.get('*', (req, res) => {
    res.status(404).end();
  });

  app.use((error, req, res, _) => {
    res.status(500).send({
      error: {
        message: error.message,
        ...error,
      },
    });
  });

  return app;
}

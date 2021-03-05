import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import compression from 'compression';

import routes from './routes';
import errorHandler from './middleware/errorHandler';

import { log } from './logging';

import { version } from '../package.json';

const isDevelopment = process.env.NODE_ENV === 'development';

const SUPPORTED_CLIENT_VERSIONS = ['1.0.0'];

export function createApp({ sequelize, models }) {
  // Init our app
  const app = express();
  app.use(compression());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    res.setHeader('X-Runtime', 'Tamanu LAN Server');
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

  app.use((req, res, next) => {
    req.models = models;
    req.db = sequelize;

    next();
  });

  app.use((req, res, next) => {
    const clientVersion = req.header('X-Client-Version');
    if (!SUPPORTED_CLIENT_VERSIONS.includes(clientVersion)) {
      res
        .setHeader('X-Min-Client-Version', SUPPORTED_CLIENT_VERSIONS.sort()[0])
        .status(400)
        .end();
    }
    next();
  });

  app.use('/', routes);

  // Dis-allow all other routes
  app.get('*', (req, res) => {
    res.status(404).end();
  });

  app.use(errorHandler);

  return app;
}

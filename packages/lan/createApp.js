import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import compression from 'compression';

import routes from './app/routes';
import errorHandler from './app/middleware/errorHandler';

import { log } from './app/logging';

const isDevelopment = process.env.NODE_ENV === 'development';

export function createApp({
  sequelize,
  models,
}) {
  // Init our app
  const app = express();
  app.use(compression());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(morgan(isDevelopment ? 'dev' : 'tiny', {
    stream: {
      write: message => log.info(message)
    }
  }));

  app.use((req, res, next) => {
    req.models = models;
    req.db = sequelize;
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

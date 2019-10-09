import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import compression from 'compression';

import routes from './app/routes';
import errorHandler from './app/middleware/errorHandler';

const isDevelopment = process.env.NODE_ENV === 'development';

export function createApp(database) {
  // Init our app
  const app = express();
  app.use(compression());
  app.use(morgan(isDevelopment ? 'dev' : 'tiny'));

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(errorHandler);
  app.use((req, res, next) => {
    req.db = database;
    next();
  });
  app.use('/', routes);

  // Dis-allow all other routes
  app.get('*', (req, res) => {
    res.status(404).end();
  });
  return app;
}

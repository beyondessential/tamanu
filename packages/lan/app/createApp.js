import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import compression from 'compression';

import routes from './routes';
import errorHandler from './middleware/errorHandler';

import { NotFoundError } from 'shared/errors';

import { log } from './logging';

const isDevelopment = process.env.NODE_ENV === 'development';

export function createApp({ sequelize, models }) {
  // Init our app
  const app = express();
  app.use(compression());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

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

    req.findRouteObject = async modelName => {
      const { models, params } = req;
      const model = models[modelName];
      // check the user can read this model type before searching for it
      // (otherwise, they can see if they get a "not permitted" or a
      // "not found" to snoop for objects)
      req.checkPermission('read', modelName);
      const object = await model.findByPk(params.id, {
        include: model.getFullReferenceAssociations(),
      });
      if(!object) throw new NotFoundError();
      req.checkPermission('read', object);
      return object;
    };

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

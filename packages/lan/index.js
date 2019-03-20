import config from 'config';
import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import compression from 'compression';
import service from 'os-service';

import { schemas, version as schemaVersion } from 'Shared/schemas';
import routes from './app/routes';
import errorHandler from './app/middleware/errorHandler';
import Database from './app/services/database';
import Listeners from './app/services/listeners';
import RemoteAuth from './app/services/remote-auth';

import { startScheduledTasks } from './app/tasks';

const port = config.port || 4500;
const isDevelopment = process.env.NODE_ENV === 'development';

(async () => {
  // Start os-service
  // service.run(() => {
  //   console.log('Service runninFg.');
  // });

  // // Init our app
  const app = express();
  app.use(compression());
  app.use(morgan(isDevelopment ? 'dev' : 'tiny'));

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(errorHandler);
  app.use('/', routes);

  if (isDevelopment) {
    app.use('/_ping', (req, res) => {
      res.status(200).send('OK!');
    });
  }

  // Dis-allow all other routes
  app.get('*', (req, res) => {
    res.status(404).end();
  });

  const startServer = (database) => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}!`);
    });

    startScheduledTasks(database);
  };

  try {
    const database = new Database({
      path: `./data/${config.db.name}.realm`,
      schema: schemas,
      schemaVersion,
    });

    // Set database sync
    const listeners = new Listeners(database);
    listeners.addDatabaseListeners();

    if (config.offlineMode) {
      startServer(database);
    } else {
      // Prompt user to login before activating sync
      const authService = new RemoteAuth(database);
      authService.promptLogin(() => {
        startServer(database);
        listeners.setupSync();
      });
    }

    // // Set realm  instance to be accessible app wide
    app.set('database', database);
  } catch (err) {
    throw new Error(err);
  }
})();

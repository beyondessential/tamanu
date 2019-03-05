import config from 'config';
import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import compression from 'compression';
import service from 'os-service';

import routes from './app/routes';
import errorHandler from './app/middleware/errorHandler';
import database from './app/services/database';
import Listeners from './app/services/listeners';
import RemoteAuth from './app/services/remote-auth';

import { startScheduledTasks } from './app/tasks';

process.env["NODE_CONFIG_DIR"] = `${__dirname}/config/`;
const ENV = process.env.NODE_ENV || 'production';

const port = config.port || 4500;

(async () => {
  // Start os-service
  // service.run(() => {
  //   console.log('Service runninFg.');
  // });

  // // Init our app
  const app = express();
  app.use(compression());
  app.use(morgan(ENV === 'development' ? 'dev' : 'tiny'));

  // console.log({ ENV, config, _env: process.env });
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(errorHandler);
  app.use('/', routes);

  if (ENV === 'development') {
    app.use('/_ping', (req, res) => {
      res.status(200).send('OK!');
    });
  }

  // Dis-allow all other routes
  app.get('*', (req, res) => {
    res.status(404).end();
  });

  const startServer = () => {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}!`);
    });

    startScheduledTasks();
  };

  try {
    // Set database sync
    const listeners = new Listeners(database);
    listeners.addDatabaseListeners();

    if (config.offlineMode) {
      startServer();
    } else {
      // Prompt user to login before activating sync
      const authService = new RemoteAuth(database);
      authService.promptLogin(() => {
        startServer();
        listeners.setupSync();
      });
    }

    // Set realm  instance to be accessible app wide
    app.set('database', database);
  } catch (err) {
    throw new Error(err);
  }
})();

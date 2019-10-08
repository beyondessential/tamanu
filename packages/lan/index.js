import config from 'config';
import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import compression from 'compression';

import { schemas, version as schemaVersion } from 'Shared/schemas';
import routes from './app/routes';
import errorHandler from './app/middleware/errorHandler';
import Database from './app/services/database';
import Listeners from './app/services/listeners';
import RemoteAuth from './app/services/remote-auth';

import { startScheduledTasks } from './app/tasks';
import { startDataChangePublisher } from './DataChangePublisher';

const port = config.port;
const isDevelopment = process.env.NODE_ENV === 'development';

(async () => {
  // Set up database
  const database = new Database({
    path: `./data/${config.db.name}.realm`,
    schema: schemas,
    schemaVersion,
  });

  // Set up database sync
  const listeners = new Listeners(database);
  listeners.addDatabaseListeners();

  // Init our app
  const app = express();
  app.use(compression());
  app.use(morgan(isDevelopment ? 'dev' : 'tiny'));

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(errorHandler);
  app.use((err, req, res, next) => {
    req.db = database;
    next();
  });
  app.use('/', routes);

  // Dis-allow all other routes
  app.get('*', (req, res) => {
    res.status(404).end();
  });

  const startServer = () => {
    const server = app.listen(port, () => {
      console.log(`Server is running on port ${port}!`);
    });
    // Set up change publishing
    startDataChangePublisher(server, database);

    startScheduledTasks(database);
  };

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
})();

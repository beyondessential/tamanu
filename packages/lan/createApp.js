import config from 'config';
import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import compression from 'compression';

import routes from './app/routes';
import errorHandler from './app/middleware/errorHandler';
import RemoteAuth from './app/services/remote-auth';

import { startScheduledTasks } from './app/tasks';
import { startDataChangePublisher } from './DataChangePublisher';

const port = config.port;
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
  return app;
}

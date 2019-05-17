import http from 'http';
import config from 'config';
import express from 'express';
import faye from 'faye';
import morgan from 'morgan';
import compression from 'compression';
import bodyParser from 'body-parser';
import path from 'path';
import serveIndex from 'serve-index';
import errorHandler from './app/middleware/errorHandler';
import Database from './app/services/database';
import Listeners from './app/services/listeners';
import appRoutes from './app/routes';
import seed from './.seeds';
import { schemas, version as schemaVersion } from '../shared/schemas';
const ENV = process.env.NODE_ENV || 'development';

(async () => {
  // Init our app
  const app = express();
  const server = http.createServer(app);
  const bayeux = new faye.NodeAdapter({ mount: config.sync.path, timeout: 45 });

  bayeux.attach(server);
  app.use(compression());
  app.use(morgan(ENV === 'development' ? 'dev' : 'tiny'));
  app.use(bodyParser.json());

  app.use(express.json());
  app.use('/assets', express.static(path.join(__dirname, './app/public/assets')));
  app.use('/.well-known', express.static('.well-known'), serveIndex('.well-known'));
  app.use('/', appRoutes);

  if (ENV === 'development') {
    app.use('/_ping', (req, res) => {
      res.status(200).send('OK!');
    });
  }

  // Dis-allow all other routes
  app.get('*', (req, res) => {
    res.status(404).end();
  });

  app.use(errorHandler);

  // // Setup databases
  try {
    // Get database patch
    let dbPath = './data';
    if (ENV === 'production') {
      const cwd = process.cwd();
      const matches = cwd.match(new RegExp('/tamanu-([a-zA-z]+)-([a-zA-z]+)/'));
      const [, envType, branch] = matches;
      dbPath = `${process.env.DB_BASE_PATH}/${envType}-${branch}`;
    }

    // Connect database
    console.log(`Database path: ${dbPath}`);
    const database = new Database({
      path: `${dbPath}/main.realm`,
      schema: schemas,
      schemaVersion,
    });

    // Set database sync
    const listeners = new Listeners(database, bayeux);
    listeners.addDatabaseListeners();

    // Set realm  instance to be accessible app wide
    app.set('realm', database);

    // Initialize seeds
    // if (ENV === 'development') await seed(database);
  } catch (err) {
    throw new Error(err);
  }

  // Start our app
  const port = config.app.port || 3000;
  server.listen(port, () => {
    console.log(`Server is running on port ${port}!`);
  });

  return app;
})();

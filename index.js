(async () => {
  const ENV = process.env.NODE_ENV || 'production';
  const config = require('./config');
  const express = require('express');
  const bodyParser = require('body-parser');
  const morgan = require('morgan');
  const compression = require('compression');
  const service = require('os-service');

  const routes = require('./app/routes');
  const errorHandler = require('./app/middleware/errorHandler');
  const Database = require('./app/services/database');
  const Listeners = require('./app/services/listeners');
  const Auth = require('./app/services/auth');
  const { schemas, version: schemaVersion } = require('./tamanu-common/schemas');

  const port = config.port || 4500;

  // Start os-service
  // service.run(() => {
  //   console.log('Service running.');
  // });

  // // Init our app
  const app = express();
  app.use(compression());
  app.use(morgan(ENV === 'development' ? 'dev' : 'tiny'));
  // app.use(basicAuth({
  //   users: { [config.localDB.username]: [config.localDB.password] }
  // }));

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
  };

  try {
    // Connect database
    const database = new Database({
      path: `./data/${config.db.name}.realm`, // './data/main.realm',
      schema: schemas,
      schemaVersion
    });

    // Set database sync
    const listeners = new Listeners(database);
    listeners.addDatabaseListeners();

    if (config.offlineMode) {
      startServer();
    } else {
      // Prompt user to login before activating sync
      const authService = new Auth(database);
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

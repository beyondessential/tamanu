(async () => {
  const ENV = process.env.NODE_ENV || 'production';
  const config = require('./config');
  const express = require('express');
  const PouchDB = require('pouchdb');
  const morgan = require('morgan');
  const compression = require('compression');
  const bodyParser = require('body-parser');
  const expressPouch = require('express-pouchdb');
  const basicAuth = require('express-basic-auth');
  const exec = require('exec');

  // exec(['ls', '-lha'], (err, out, code) => {
  //   if (err instanceof Error) {
  //     throw err;
  //   }
  //   process.stderr.write(err);
  //   process.stdout.write(out);
  //   process.exit(code);
  // });

  const errorHandler = require('./app/middleware/errorHandler');
  // const couchProxy = require('./app/middleware/forwardCouch');
  const dbService = require('./app/services/database');
  const replicationService = require('./app/services/replication');

  // // Init our app
  PouchDB.plugin(require('pouchdb-find'));
  const app = express();
  const OurPouchDB = PouchDB.defaults({
    prefix: './data/',
  });

  console.log({ DB: config.localDB });

  app.use(compression());
  app.use(morgan(ENV === 'development' ? 'dev' : 'tiny'));
  app.use(basicAuth({
    users: { [config.localDB.username]: [config.localDB.password] }
  }));

  // console.log({ ENV, config, _env: process.env });
  // app.use(bodyParser.raw());
  // app.use('/', couchProxy);
  app.use('/', expressPouch(OurPouchDB, {
    // configPath: './config/pouchdb.json',
    overrideMode: {
      exclude: [
        'routes/fauxton',
        'routes/authentication',
        'routes/authorization',
        'routes/session'
      ]
    }
  }));

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

  // Setup databases
  await dbService.setup({ PouchDB: OurPouchDB });
  replicationService.setup({ PouchDB: OurPouchDB });
  // listeners.addDatabaseListeners('main');

  // Start our app
  const port = config.port || 4500;
  app.listen(port, () => {
      console.log(`Server is running on port ${port}!`);
  });
})();

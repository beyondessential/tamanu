const run = async () => {
    const ENV          = process.env.NODE_ENV || 'development';
    const config       = require('config');
    const express      = require('express');
    const morgan       = require('morgan');
    const compression  = require('compression');
    const bodyParser   = require('body-parser');

    const errorHandler = require('./app/middleware/errorHandler');
    const couchProxy = require('./app/middleware/forwardCouch');
    const dbService = require('./app/services/database');
    const replicationService = require('./app/services/replication');

    // Init our app
    const app = express();

    app.use(compression());
    app.use(morgan(ENV === 'development' ? 'dev' : 'tiny'));
    app.use(bodyParser.raw());
    app.use('/', couchProxy);

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
    await dbService.setup();
    await replicationService.setup();
    // listeners.addDatabaseListeners('main');

    // Start our app
    const port = config.app.port || 4000;
    app.listen(port, () => {
        console.log(`Server is running on port ${port}!`);
    });

    return app;
};

module.export = run();

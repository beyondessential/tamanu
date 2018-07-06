const run = async () => {
    const ENV = process.env.NODE_ENV || 'development';
    const http = require('http');
    const config = require('config');
    const express = require('express');
    const faye = require('faye');
    const morgan = require('morgan');
    const compression = require('compression');
    const bodyParser = require('body-parser');
    const path = require('path');
    const serveIndex = require('serve-index');
    const errorHandler = require('./app/middleware/errorHandler');
    const dbService = require('./app/services/database');
    const listeners = require('./app/services/listeners');
    const appRoutes = require('./app/routes');

    // Init our app
    const app = express();
    const server = http.createServer(app);
    const bayeux = new faye.NodeAdapter({ mount: '/couch-sync', timeout: 45 });

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

    // Setup services
    try {
      await dbService.setup();
      listeners.addDatabaseListeners('main', bayeux);
    } catch (err) {
      console.error(err);
    }

    bayeux.on('handshake', (clientId) => {
        console.log('Client connected', clientId);
    });

    // Start our app
    const port = config.app.port || 3000;
    server.listen(port, () => {
        console.log(`Server is running on port ${port}!`);
    });

    return app;
};

module.export = run();

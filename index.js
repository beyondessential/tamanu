const build = async () => {
    const ENV          = process.env.NODE_ENV || 'development';
    const AWS          = require('aws-sdk');
    const config       = require('config');
    const express      = require('express');
    const session      = require('express-session');
    const morgan       = require('morgan');
    const compression  = require('compression');
    const bodyParser   = require('body-parser');
    const path         = require('path');
    const mongoose     = require('mongoose');
    const passport     = require('passport');
    const cons         = require('consolidate');
    const serveIndex   = require('serve-index');

    const errorHandler = require('./app/middleware/errorHandler');

    // Load routes
    const appRoutes = require('./app/routes');

    // TODO: move this to aws helper, credentials won't be required in EC2
    // Update AWS config from config file
    AWS.config.update({
        region: config.aws.region,
    });

    // Init our app
    const app = express();

    app.use(compression());
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(morgan(ENV === 'development' ? 'dev' : 'tiny'));

    // Init sessions
    app.set('trust proxy', 1); // trust first proxy
    app.use(session({
        secret: 'iohIHH*3o*)#NInkfdpfINPIN',
        resave: false,
        saveUninitialized: true,
        // cookie: { secure: true }
    }));

    // view engine setup
    app.engine('html', cons.swig);
    app.set('views', path.join(__dirname, 'app/views'));
    app.set('view engine', 'html');

    // Initialize passport
    app.use(passport.initialize());
    app.use(passport.session({
        resave: false,
        saveUninitialized: true
    }));

    app.use(passport.initialize());

    // app.use(express.json());
    app.use('/assets', express.static(path.join(__dirname, './app/public/assets')));
    app.use('/.well-known', express.static('.well-known'), serveIndex('.well-known'));

    if (ENV === 'development') {
        app.use('/_ping', (req, res) => {
            res.status(200).send('OK!');
        });
    }

    app.use('/', appRoutes);

    // Dis-allow all other routes
    app.get('*', (req, res) => {
        res.status(404).end();
    });

    app.use(errorHandler);

    // Start our app
    const port = config.app.port || 3000;
    app.listen(port, () => {
        console.log(`Server is running on port ${port}!`);
    });

    return app;
};

module.export = build();

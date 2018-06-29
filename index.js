const run = async () => {
    const ENV          = process.env.NODE_ENV || 'development';
    const config       = require('config');
    const express      = require('express');
    const session      = require('express-session');
    const morgan       = require('morgan');
    const compression  = require('compression');
    const bodyParser   = require('body-parser');
    const path         = require('path');
    const serveIndex   = require('serve-index');
    const Promise      = require('bluebird');
    const { to }       = require('await-to-js');

    const errorHandler = require('./app/middleware/errorHandler');

    // Load routes
    const appRoutes = require('./app/routes');

    // Init our app
    const app = express();

    app.use(compression());
    app.use(morgan(ENV === 'development' ? 'dev' : 'tiny'));
    app.use(bodyParser.json());

    // Init sessions
    app.set('trust proxy', 1); // trust first proxy
    app.use(session({
        secret: 'iohIHH*3o*)#NInkfdpfINPIN',
        resave: false,
        saveUninitialized: true,
        // cookie: { secure: true }
    }));

    // view engine setup
    // app.engine('html', cons.swig);
    // app.set('views', path.join(__dirname, 'app/views'));
    // app.set('view engine', 'html');

    // Initialize passport
    // app.use(passport.initialize());
    // app.use(passport.session({
    //     resave: false,
    //     saveUninitialized: true
    // }));

    // app.use(passport.initialize());

    // app.use(express.json());
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

    // Setup databases
    const dbUrl = `http://${config.db.user}:${config.db.password}@${config.db.host}:${config.db.port}`;
    const nano = require('nano')(dbUrl);
    Promise.promisifyAll(nano.db);

    let [err, pushDB] = await to(nano.db.getAsync('pushinfo'));
    if (err && err.error === 'not_found') [err, pushDB] = await to(nano.db.createAsync('pushinfo'));
    if (err) throw new Error(err);
    console.log('Database pushinfo added!');

    // Start our app
    const port = config.app.port || 3000;
    app.listen(port, () => {
        console.log(`Server is running on port ${port}!`);
    });

    return app;
};

module.export = run();

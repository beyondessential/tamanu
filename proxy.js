const ENV          = process.env.NODE_ENV || 'development';
const config       = require('config');
const express      = require('express');
const morgan       = require('morgan');
const compression  = require('compression');
const bodyParser   = require('body-parser');

const errorHandler = require('./app/middleware/errorHandler');
const couchProxy = require('./app/middleware/forwardCouch');

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

// Start our app
const port = config.proxy.port || 3500;
app.listen(port, () => {
    console.log(`Server is running on port ${port}!`);
});

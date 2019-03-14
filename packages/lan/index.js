// must appear before 'config' module is imported
process.env.NODE_CONFIG_DIR = `${__dirname}/config/`;

require('@babel/register');
require('./app.js');

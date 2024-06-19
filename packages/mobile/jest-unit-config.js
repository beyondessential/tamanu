/* eslint-disable */
const config = require('./jest.config.mjs');

config.testRegex = '(/App/.*\\.spec)\\.(ts|tsx|js)$',

module.exports = config;

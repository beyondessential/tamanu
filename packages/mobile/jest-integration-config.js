/* eslint-disable */
const config = require('./jest.config.mjs')

config.testRegex = '(/App/.*\\.test)\\.(ts|tsx|js)$',

module.exports = config

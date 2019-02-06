const sharedUtils = require('../../../shared/utils');
const { incoming } = require('./faye-extensions');

module.exports = { ...sharedUtils, incoming };

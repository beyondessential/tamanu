const { SWC } = require('../../common.jest.config');

module.exports = {
  ...SWC,
  setupFilesAfterEnv: ['<rootDir>/__tests__/configureEnvironment.js'],
};

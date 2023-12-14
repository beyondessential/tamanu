const { BASE } = require('../../common.jest.config');

module.exports = {
  ...BASE,
  setupFilesAfterEnv: ['<rootDir>/__tests__/configureEnvironment.js'],
};

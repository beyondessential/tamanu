const { SWC } = require('../../common.jest.config');

module.exports = {
  ...SWC,
  globalTeardown: '<rootDir>/__tests__/teardown.js',
  setupFilesAfterEnv: ['<rootDir>/__tests__/configureEnvironment.js', 'jest-expect-message'],
};

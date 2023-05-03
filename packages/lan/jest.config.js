const { BABEL } = require('../../common.jest.config');

module.exports = {
  ...BABEL,
  globalTeardown: '<rootDir>/__tests__/teardown.js',
  setupFilesAfterEnv: ['<rootDir>/__tests__/configureEnvironment.js', 'jest-expect-message'],
};

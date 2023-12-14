const { BASE } = require('../../common.jest.config');

module.exports = {
  ...BASE,
  globalTeardown: '<rootDir>/__tests__/teardown.js',
  setupFilesAfterEnv: ['<rootDir>/__tests__/configureEnvironment.js', 'jest-expect-message'],
};

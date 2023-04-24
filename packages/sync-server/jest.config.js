const common = require('../../jest.config.common.js');

module.exports = {
  ...common,
  testRegex: '(\\.|/)(test|spec)\\.[jt]sx?$',
  globalSetup: '<rootDir>/__tests__/setup.js',
  globalTeardown: '<rootDir>/__tests__/teardown.js',
  setupFilesAfterEnv: ['<rootDir>/__tests__/configureEnvironment.js', 'jest-expect-message'],
  collectCoverageFrom: ['app/**/*.js'],
};
const common = require('../jest.config.common.js');

module.exports = {
  ...common,
  setupFiles: ['<rootDir>/__tests__/setup.js'],
  testRegex: '(\\.|/)(test|spec)\\.[jt]sx?$',
  collectCoverageFrom: ['src/**/*.js'],
};

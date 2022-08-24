module.exports = {
  transform: {
    '^.+\\.js$': '<rootDir>/jest.babel.js',
  },
  testRegex: '(\\.|/)(test|spec)\\.[jt]sx?$',
  globalSetup: '<rootDir>/__tests__/setup.js',
  globalTeardown: '<rootDir>/__tests__/teardown.js',
  setupFilesAfterEnv: ['<rootDir>/__tests__/configureEnvironment.js', 'jest-extended/all'],
  collectCoverageFrom: ['app/**/*.js'],
};

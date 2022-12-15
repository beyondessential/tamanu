module.exports = {
  transform: {
    '^.+\\.js$': ['@swc/jest'],
  },
  testMatch: ['<rootDir>/__tests__/**/*.test.js?(x)'],
  globalSetup: '<rootDir>/__tests__/setup.js',
  globalTeardown: '<rootDir>/__tests__/teardown.js',
  setupFilesAfterEnv: ['<rootDir>/__tests__/configureEnvironment.js', 'jest-expect-message'],
  collectCoverageFrom: ['app/**/*.js'],

  // workaround for memory leaks
  workerIdleMemoryLimit: '512MB',
};

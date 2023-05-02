module.exports = {
  transform: {
    '^.+\\.js$': ['@swc/jest'],
  },
  setupFiles: ['<rootDir>/__tests__/setup.js'],
  testRegex: '(\\.|/)(test|spec)\\.[jt]sx?$',
  collectCoverageFrom: ['src/**/*.js'],

  // workaround for memory leaks
  workerIdleMemoryLimit: '512MB',
};

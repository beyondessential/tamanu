module.exports = {
  transform: {
    '^.+\\.js$': ['@swc/jest'],
  },
  testRegex: '(\\.|/)(test|spec)\\.[jt]sx?$',
  collectCoverageFrom: ['app/**/*.js'],

  // workaround for memory leaks
  workerIdleMemoryLimit: '512MB',
};

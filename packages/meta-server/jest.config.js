module.exports = {
  transform: {
    '^.+\\.js$': '<rootDir>/jest.babel.js',
  },
  testRegex: '(\\.|/)(test|spec)\\.[jt]sx?$',
  collectCoverageFrom: ['app/**/*.js'],

  // workaround for memory leaks
  workerIdleMemoryLimit: '512MB',
};

module.exports = {
  transform: {
    '^.+\\.[jt]s$': ['@swc/jest'],
  },
  setupFiles: ['<rootDir>/__tests__/setup.ts'],
  testRegex: '(\\.|/)(test|spec)\\.[jt]sx?$',
  collectCoverageFrom: ['src/**/*.js', 'src/**/*.ts'],

  // workaround for memory leaks
  workerIdleMemoryLimit: '512MB',
};

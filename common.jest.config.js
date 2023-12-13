const isCI = !!process.env.CI;

const BASE = {
  setupFiles: ['<rootDir>/__tests__/setup.js'],
  testRegex: '(\\.|/)(test|spec)\\.[jt]sx?$',
  collectCoverageFrom: ['src/**/*.[jt]sx?'],

  maxWorkers: isCI ? '100%' : '50%',

  // workaround for memory leaks
  workerIdleMemoryLimit: '512MB',

  showSeed: true, // helps to reproduce order-dependence bugs

  transform: {
    '^.+\\.js$': ['@swc/jest'],
  },
};

module.exports = { BASE };

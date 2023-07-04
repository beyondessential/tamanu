const isCI = !!process.env.CI;

const BASE = {
  setupFiles: ['<rootDir>/__tests__/setup.js'],
  testRegex: '(\\.|/)(test|spec)\\.[jt]sx?$',
  collectCoverageFrom: ['src/**/*.js'],

  maxWorkers: isCI ? '100%' : '50%',

  // workaround for memory leaks
  workerIdleMemoryLimit: '512MB',

  showSeed: true, // helps to reproduce order-dependence bugs

  moduleNameMapper: {
    '^shared(/.+)?$': '@tamanu/shared$1',
  },
};

const BABEL = {
  ...BASE,
  transform: {
    '^.+\\.js$': '<rootDir>/jest.babel.js',
  },
};

const SWC = {
  ...BASE,
  transform: {
    '^.+\\.js$': ['@swc/jest'],
  },
};

module.exports = { BABEL, SWC };

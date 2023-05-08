const BASE = {
  setupFiles: ['<rootDir>/__tests__/setup.js'],
  testRegex: '(\\.|/)(test|spec)\\.[jt]sx?$',
  collectCoverageFrom: ['src/**/*.js'],

  // workaround for memory leaks
  workerIdleMemoryLimit: '512MB',

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

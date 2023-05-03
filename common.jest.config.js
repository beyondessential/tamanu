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
  transform: {
    '^.+\\.js$': '<rootDir>/jest.babel.js',
  },
  ...BASE,
};

const SWC = {
  transform: {
    '^.+\\.js$': ['@swc/jest'],
  },
  ...BASE,
};

module.exports = { BABEL, SWC };

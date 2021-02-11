module.exports = {
  transform: {
    '^.+\\.js$': '<rootDir>/jest.babel.js',
  },
  testRegex: '(\\.|/)(test|spec)\\.[jt]sx?$',
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/app/$1',
  },
  testEnvironment: 'node',
  collectCoverageFrom: ['app/**/*.js'],
};

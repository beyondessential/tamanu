module.exports = {
  transform: {
    '^.+\\.js$': '<rootDir>/jest.babel.js',
  },
  testRegex: '(\\.|/)(test|spec)\\.[jt]sx?$',
  testEnvironment: 'jest-environment-node-single-context',
  collectCoverageFrom: ['app/**/*.js'],
};

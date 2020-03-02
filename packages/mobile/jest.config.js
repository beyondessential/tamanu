module.exports = {
  preset: '@testing-library/react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@?react-navigation|react-pose-core|react-native-gesture-handler|animated-pose|@react-native-community/datetimepicker)',
  ],
  transform: {
    '^.+\\.(js)$': '<rootDir>/node_modules/babel-jest',
    '\\.(ts|tsx)$': 'ts-jest',
  },
  testRegex: '(/App/.*\\.test)\\.(ts|tsx|js)$',
  testPathIgnorePatterns: ['\\.snap$', '<rootDir>/node_modules/'],
  cacheDirectory: '.jest/cache',
  setupFiles: ['./jest.setup.ts'],
};

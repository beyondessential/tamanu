module.exports = {
  preset: '@testing-library/react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@?react-navigation|react-pose-core|react-native-gesture-handler|animated-pose|@react-native-community/datetimepicker|@vinipachecov/react-native-datepicker)',
  ],
  transform: {
    '^.+\\.(js)$': '<rootDir>/node_modules/babel-jest',
    '\\.(ts|tsx)$': 'ts-jest',
  },
  testPathIgnorePatterns: ['\\.snap$', '<rootDir>/node_modules/'],
  cacheDirectory: '.jest/cache',
  setupFiles: ['./jest.setup.ts'],
  moduleDirectories: ['.', 'node_modules'],
  moduleNameMapper: {
    '^/helpers(.*)$': '<rootDir>/App/helpers$1',
    '^/styled(.*)$': '<rootDir>/App/ui/styled$1',
    '^/components(.*)$': '<rootDir>/App/components$1',
    '^/interfaces(.*)$': '<rootDir>/App/interfaces$1',
    '^/navigation(.*)$': '<rootDir>/App/navigation$1',
    '^/services(.*)$': '<rootDir>/App/services$1',
  },
};

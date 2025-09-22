module.exports = {
  preset: '@testing-library/react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?@?react-native|@?react-navigation|react-pose-core|react-native-gesture-handler|animated-pose|@react-native-community/datetimepicker|@vinipachecov/react-native-datepicker|typeorm|react-native-quick-sqlite)',
  ],
  transform: {
    '^.+\\.(ts|js)$': '<rootDir>/../../node_modules/babel-jest',
    '\\.(ts|tsx)$': [
      '<rootDir>/../../node_modules/ts-jest',
      {
        tsconfig: 'tsconfig.json',
        diagnostics: {
          warnOnly: true,
        },
      },
    ],
  },
  testEnvironment: 'node',
  testPathIgnorePatterns: ['\\.snap$', '<rootDir>/../../node_modules/', 'e2e'],
  cacheDirectory: '.jest/cache',
  setupFiles: ['./jest.setup.ts'],
  moduleNameMapper: {
    '^~(.*)$': '<rootDir>/App$1',
    '^/root(.*)$': '<rootDir>$1',
    '^/helpers(.*)$': '<rootDir>/App/ui/helpers$1',
    '^/types(.*)$': '<rootDir>/App/types/$1',
    '^/styled(.*)$': '<rootDir>/App/ui/styled$1',
    '^/components(.*)$': '<rootDir>/App/ui/components$1',
    '^/interfaces(.*)$': '<rootDir>/App/ui/interfaces$1',
    '^/navigation(.*)$': '<rootDir>/App/ui/navigation$1',
    '^/contexts(.*)$': '<rootDir>/App/ui/contexts$1',
    '^/services(.*)$': '<rootDir>/App/ui/services$1',
    '^/domain(.*)$': '<rootDir>/App/domain$1',
    '^/data(.*)$': '<rootDir>/App/data$1',
    '/infra(.*)$': '<rootDir>/App/infra$1',
    'react-native-sqlite-storage': 'react-native-quick-sqlite',
    'react-native-quick-sqlite': '<rootDir>/__mocks__/react-native-quick-sqlite.ts',
  },
  collectCoverageFrom: ['App/**/*.{js,ts,jsx,tsx}', '!**/*.spec.{js,ts,jsx,tsx}'],
};

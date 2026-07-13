module.exports = {
  preset: '@react-native/jest-preset',
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  transformIgnorePatterns: [
    // @tamanu workspace packages are TypeScript source, and lodash-es/es-toolkit ship
    // only ESM, so jest must transform them rather than ignore them with the rest of
    // node_modules.
    'node_modules/(?!((jest-)?react-native|@react-native(-community|-masked-view)?|@react-native-async-storage|@react-navigation|react-native-.*|typeorm|@tamanu|lodash-es|es-toolkit)/)',
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
  testPathIgnorePatterns: ['\\.snap$', '<rootDir>/../../node_modules/'],
  cacheDirectory: '.jest/cache',
  setupFiles: ['./jest.setup.ts'],
  moduleNameMapper: {
    // @tamanu workspace source uses the `.js` import extension convention even for
    // `.ts` files (e.g. `export * from './ai.js'`); strip it so jest resolves against
    // moduleFileExtensions (which prefers `.ts`, falling back to real `.js`).
    '^(\\.{1,2}/.*)\\.js$': '$1',
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

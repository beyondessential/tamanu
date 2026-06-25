import { config } from '../../common.jest.config.mjs';

export default config(
  import.meta,
  {
    testEnvironment: 'jest-environment-node',
    testPathIgnorePatterns: ['<rootDir>/app/', '<rootDir>/__disttests__/', '<rootDir>/dist/', '/node_modules/'],
    setupFilesAfterEnv: ['<rootDir>/__tests__/configureEnvironment.js', 'jest-expect-message'],
  },
  { transformNodeModules: ['sequelize'] },
);

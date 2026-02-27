import { config } from '../../common.jest.config.mjs';

export default config(
  import.meta,
  {
    testEnvironment: 'jest-environment-node',
    testPathIgnorePatterns: ['<rootDir>/app/', '<rootDir>/__tests__/', '/node_modules/'],
    globalTeardown: '<rootDir>/__disttests__/teardown.js',
    setupFiles: ['<rootDir>/__disttests__/setup.js'],
    setupFilesAfterEnv: ['jest-extended/all', '<rootDir>/__disttests__/configureEnvironment.js', 'jest-expect-message'],
  },
  { transformNodeModules: ['sequelize', '@smithy/middleware-retry', '@aws-sdk/client-s3'] },
);

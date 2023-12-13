import { BASE } from '../../common.jest.config.mjs';

export default {
  ...BASE,
  globalTeardown: '<rootDir>/__tests__/teardown.js',
  setupFilesAfterEnv: ['<rootDir>/__tests__/configureEnvironment.js', 'jest-expect-message'],
};

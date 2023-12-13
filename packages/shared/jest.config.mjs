import { BASE } from '../../common.jest.config.mjs';

export default {
  ...BASE,
  setupFilesAfterEnv: ['<rootDir>/__tests__/configureEnvironment.js'],
};

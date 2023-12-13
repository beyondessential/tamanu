import { config } from '../../common.jest.config.mjs';

export default config(import.meta, {
  setupFilesAfterEnv: ['<rootDir>/__tests__/configureEnvironment.js'],
});

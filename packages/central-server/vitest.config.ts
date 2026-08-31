// @ts-expect-error - plain .mjs config shared across the workspace
import { config, SERVER_TEST_TIMEOUT, SETUP_HOOK_TIMEOUT } from '../../common.vitest.config.mjs';

export default config({
  test: {
    testTimeout: SERVER_TEST_TIMEOUT,
    hookTimeout: SETUP_HOOK_TIMEOUT,
    setupFiles: ['./__tests__/configureEnvironment.js'],
  },
});

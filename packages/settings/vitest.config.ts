// @ts-expect-error - plain .mjs config shared across the workspace
import { config } from '../../common.vitest.config.mjs';

export default config({
  test: {
    // 100s, carried over from what this package's suite ran with under jest
    testTimeout: 100_000,
    hookTimeout: 100_000,
    // suppress warning about empty config
    env: { SUPPRESS_NO_CONFIG_WARNING: 'true' },
  },
});

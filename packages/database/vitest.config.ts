// @ts-expect-error - plain .mjs config shared across the workspace
import { config } from '../../common.vitest.config.mjs';

export default config({
  test: {
    hookTimeout: 30_000,
  },
});

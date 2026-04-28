import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    hookTimeout: 30_000,
  },
});

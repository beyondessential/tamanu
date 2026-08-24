import { defineConfig } from 'vitest/config';
// @ts-expect-error - plain .mjs module shared with scripts/
import { vitestProjects } from './scripts/vitestProjects.mjs';

// Root config for local development: one invocation runs every vitest package, sharing a
// module graph for watch mode and merging coverage across projects. CI still invokes each
// package separately (see scripts/plan-ci.mjs) so it can shard and skip untouched packages.
export default defineConfig({
  test: {
    projects: vitestProjects,

    coverage: {
      include: ['packages/*/src/**'],
    },
  },
});

import { defineConfig, mergeConfig } from 'vitest/config';
import { tamanuSourceResolve } from './scripts/viteTamanuSourceResolve.mjs';
import { testSeed } from './scripts/testSeed.mjs';

const isCI = Boolean(process.env.CI);

// 45s, the value `createTestContext` used to install at runtime once it had finished setting
// up (whatever a test file had asked for before that point, it got 45s during the tests).
export const SERVER_TEST_TIMEOUT = 45_000;

// createTestContext recreates a database and runs the full migration set per test file, so its
// `beforeAll` needs far more headroom than the tests do — it used to opt out of the timeout
// altogether. 10 minutes is generous against a baseline where a whole CI shard finishes in
// about 5, while still failing a genuine hang rather than hanging until the job is killed.
// TODO: lower this once the slow test setup is addressed at the source.
export const SETUP_HOOK_TIMEOUT = 600_000;

// Consume @tamanu/* workspace packages from their TypeScript source, which is what their
// `exports` point at: inline them so Vite (not Node) resolves their extensionless directory
// exports, and complete those with the shared plugin. This is the same resolution the frontends
// build with, so tests exercise module semantics that actually ship.
//
// Projects don't inherit the root config's options unless they set `extends: true`, so this
// stays a shared module each package's config spreads in rather than folding into the root.
export function config(overrides = {}) {
  return mergeConfig(
    defineConfig({
      plugins: [tamanuSourceResolve],
      resolve: {
        conditions: ['module', 'development|production'],
      },
      test: {
        server: { deps: { inline: [/@tamanu\//] } },
        maxWorkers: isCI ? '50%' : '25%',
        env: { TAMANU_TEST_SEED: String(testSeed) },
      },
    }),
    defineConfig(overrides),
  );
}

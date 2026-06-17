import { defineConfig } from 'vitest/config';
// @ts-expect-error - plain .mjs vite plugin shared with the frontends
import { tamanuSourceResolve } from '../../scripts/viteTamanuSourceResolve.mjs';

// Consume @tamanu/* workspace packages build-less from their TypeScript source:
// resolve the `source` export condition, inline them so Vite (not Node) resolves
// their extensionless directory exports, and complete those with the shared plugin.
export default defineConfig({
  plugins: [tamanuSourceResolve],
  resolve: {
    conditions: ['source', 'module', 'development|production'],
  },
  test: {
    hookTimeout: 30_000,
    server: { deps: { inline: [/@tamanu\//] } },
  },
});

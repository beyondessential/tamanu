import { defineConfig } from 'vitest/config';
// @ts-expect-error - plain .mjs vite plugin shared with the frontends
import { tamanuSourceResolve } from '../../scripts/viteTamanuSourceResolve.mjs';

// Consume @tamanu/* workspace packages from their TypeScript source.
export default defineConfig({
  plugins: [tamanuSourceResolve],
  resolve: {
    conditions: ['source', 'module', 'development|production'],
  },
});

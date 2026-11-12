import react from '@vitejs/plugin-react-swc';
import { fileURLToPath } from 'node:url';
// @ts-expect-error - plain .mjs config shared across the workspace
import { config } from '../../common.vitest.config.mjs';
import { version } from './package.json';

const fromHere = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default config({
  define: { __VERSION__: JSON.stringify(version) },
  plugins: [react()],
  resolve: {
    alias: {
      '@api': fromHere('./src/api'),
      '@utils': fromHere('./src/utils'),
      '@components': fromHere('./src/components'),
      '@routes': fromHere('./src/routes'),
    },
    conditions: ['browser'],
    dedupe: ['@mui/x-date-pickers'],
  },
  test: {
    clearMocks: true,
    environment: 'jsdom',
    setupFiles: ['./__tests__/setup.ts'],
  },
});

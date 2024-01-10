import { readFile } from 'node:fs/promises';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { json5Plugin } from 'vite-plugin-json5';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { generatePWAAssetsPlugin } from './plugins/generate-pwa-assets';

// https://vitejs.dev/config/
export default defineConfig(async ({ command }) => ({
  // point to index in public
  esbuild: {
    loader: 'jsx',
    external: ['sharp'],
  },
  plugins: [
    react(),
    json5Plugin(),
    nodePolyfills({
      globals: {
        Buffer: true,
      },
    }),
    generatePWAAssetsPlugin(command),
  ],
  define: {
    __VERSION__: JSON.stringify(
      await readFile('package.json')
        .then(JSON.parse)
        .then(({ version }) => version),
    ),
    NODE_ENV: JSON.stringify(process.env.NODE_ENV),
    process: JSON.stringify({
      env: {
        NODE_ENV: process.env.NODE_ENV,
      },
      arch: 'wasm',
      platform: 'web',
    }),
  },
  worker: {
    format: 'es',
  },
  preview: {
    https: true,
  },
  build: {
    rollupOptions: {
      output: {
        generatedCode: 'es2015',
      },
    },
  },
  server: {
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        // you can also specify other servers to use as backend, e.g.
        // target: 'https://central.main.internal.tamanu.io',
        // target: 'https://facility-1.main.internal.tamanu.io',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '/v1/'),
      },
    },
  },
}));

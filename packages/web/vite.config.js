import { readFile } from 'node:fs/promises';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { json5Plugin } from 'vite-plugin-json5';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default async ({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), 'TAMANU_'));

  return defineConfig({
    esbuild: {
      loader: 'jsx',
    },
    plugins: [
      react(),
      json5Plugin(),
      nodePolyfills({
        globals: {
          Buffer: true,
        },
      }),
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
          target: process.env.TAMANU_VITE_TARGET ?? 'https://facility-1.main.internal.tamanu.io',
          // specify other servers to use as backend by setting the variable in a .env file, e.g.
          // TAMANU_VITE_TARGET=http://localhost:3000
          // TAMANU_VITE_TARGET=http://localhost:4000
          // TAMANU_VITE_TARGET=https://central.main.internal.tamanu.io
          changeOrigin: true,
        },
        '/socket.io': {
          target: process.env.TAMANU_VITE_TARGET ?? 'https://facility-1.main.internal.tamanu.io',
          ws: true,
        }
      },
    },
  });
};

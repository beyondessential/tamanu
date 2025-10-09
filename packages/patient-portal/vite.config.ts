import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default async () =>
  defineConfig({
    define: {
      __VERSION__: JSON.stringify(
        await readFile('package.json', 'utf8')
          .then(JSON.parse)
          .then(({ version }) => version),
      ),
      process: JSON.stringify({
        env: {
          NODE_ENV: process.env.NODE_ENV,
          // todo: add revision
          // REVISION: revision,
        },
        arch: 'wasm',
        platform: 'web',
      }),
    },
    plugins: [react()],

    resolve: {
      alias: {
        '@api': path.resolve(__dirname, 'src/api'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@routes': path.resolve(__dirname, 'src/routes'),
      },
    },
    server: {
      host: 'localhost',
      port: 5175,
      proxy: {
        '/api': {
          target: process.env.TAMANU_VITE_TARGET ?? 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  });

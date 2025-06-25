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
        await readFile('package.json')
          .then(JSON.parse)
          .then(({ version }) => version),
      ),
    },
    plugins: [
      react({
        jsxRuntime: 'automatic',
      }),
    ],
    resolve: {
      alias: {
        '@utils': path.resolve(__dirname, 'src/utils'),
      },
    },
  });

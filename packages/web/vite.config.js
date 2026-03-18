import { execSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import json5Plugin from 'vite-plugin-json5';

/** @see https://vitejs.dev/config */
export default async () => {
  let revision;
  try {
    revision = execSync('git log --format="%h" -n1', { timeout: 100, encoding: 'utf-8' }).trim();
    if (execSync('git status -s', { timeout: 100, encoding: 'utf-8' }).trim()) {
      // repo is dirty (has uncommitted files)
      revision += '~';
    }
  } catch (_) {
    /* ignore */
  }

  return defineConfig({
    assetsInclude: ['/sb-preview/runtime.js'],
    optimizeDeps: {
      exclude: ['chunk-SVRLYAES'],
      include: ['buffer'],
    },
    plugins: [react(), json5Plugin(), svgr()],
    resolve: {
      dedupe: ['@mui/x-date-pickers'],
    },

    define: {
      __VERSION__: JSON.stringify(
        await readFile('package.json')
          .then(JSON.parse)
          .then(({ version }) => version),
      ),
      process: JSON.stringify({
        env: {
          NODE_ENV: process.env.NODE_ENV,
          REVISION: revision,
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
          target: process.env.TAMANU_VITE_TARGET ?? 'https://facility-1.main.cd.tamanu.app',
          // specify other servers to use as backend by setting the environment variable, e.g.
          // TAMANU_VITE_TARGET=http://localhost:3000
          // TAMANU_VITE_TARGET=http://localhost:4000
          // TAMANU_VITE_TARGET=https://central.main.cd.tamanu.app
          changeOrigin: true,
        },
        '/api/socket.io': {
          target: process.env.TAMANU_VITE_TARGET ?? 'https://facility-1.main.cd.tamanu.app',
          ws: true,
        },
      },
    },
    test: {
      clearMocks: true,
      globals: true,
      environment: 'jsdom',
    },
  });
};

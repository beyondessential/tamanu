import { readFile } from 'node:fs/promises';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { json5Plugin } from 'vite-plugin-json5';

// https://vitejs.dev/config/
export default defineConfig(async ({ command, mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    esbuild: {
      loader: 'jsx',
    },
    plugins: [react(), json5Plugin()],
    define: {
      'process.env': env,
      __VERSION__: JSON.stringify(
        await readFile('package.json')
          .then(JSON.parse)
          .then(({ version }) => version),
      ),
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
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
        '/health': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/health/, ''),
        },
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
  };
});

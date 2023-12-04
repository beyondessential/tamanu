import { readFile } from 'node:fs/promises';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  esbuild: {
    loader: 'jsx',
  },
  plugins: [react()],
  define: {
    __VERSION__: JSON.stringify(
      await readFile('package.json')
        .then(JSON.parse)
        .then(({ version }) => version),
    ),
  },
  server: {
    host: 'localhost',
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
    proxy: {
      '/api': {
        // target: 'http://localhost:4000',
        target: 'https://facility-1.main.internal.tamanu.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/v1/'),
      }
    },
  },
})

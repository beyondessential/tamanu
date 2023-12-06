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
        manualChunks(id) {
          if (!id.includes('node_modules') || id.endsWith('.css') || id.endsWith('scss')) {
            return; // index
          }

          if (id.includes('pdfjs') || id.includes('react-pdf') || id.includes('barcode')) {
            return 'pdf';
          }

          if (id.includes('@tamanu')) {
            return 'tamanu-shared';
          }

          if (id.includes('/ace') || id.includes('js-sql')) {
            return 'editor';
          }

          if (
            id.includes('react') ||
            id.includes('dom') ||
            id.includes('d3') ||
            id.includes('cheerio') ||
            id.includes('htmlparser2') ||
            id.includes('@material-ui') ||
            id.includes('charts')
          ) {
            return 'dom';
          }

          if (
            id.includes('brotli') ||
            id.includes('media-engine') ||
            id.includes('hsl-to-rgb') ||
            id.includes('pako') ||
            id.includes('xlsx') ||
            id.includes('base64-js') ||
            id.includes('crypto-js') ||
            id.includes('fontkit') ||
            id.includes('-svg-path')
          ) {
            return 'media';
          }

          if (
            id.includes('date-fns') ||
            id.includes('mathjs') ||
            id.includes('lodash') ||
            id.includes('tslib') ||
            id.includes('/es-') ||
            id.includes('/is-') ||
            id.includes('tiny-emitter') ||
            id.includes('@babel/runtime') ||
            id.includes('@swc/helpers') ||
            id.includes('core-js') ||
            id.includes('polyfill.js') ||
            id.includes('shim.js') ||
            id.includes('implementation.js') ||
            id.includes('regenerator-runtime') ||
            id.includes('.prototype.')
          ) {
            return 'utility';
          }

          // everything else in node_modules
          return 'vendor';
        },
      },
    },
  },
  server: {
    host: 'localhost',
    proxy: {
      '/api': {
        // target: 'http://localhost:4000',
        target: 'https://facility-1.main.internal.tamanu.io',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '/v1/'),
      },
    },
  },
});

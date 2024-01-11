import { readFile } from 'node:fs/promises';
import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react-swc';
import { json5Plugin } from 'vite-plugin-json5';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
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
  resolve: {
    alias: {
      crypto: path.resolve(__dirname, '.storybook/__mocks__/crypto.js'),
      buffer: path.resolve(__dirname, '.storybook/__mocks__/buffer.js'),
      sequelize: path.resolve(__dirname, '.storybook/__mocks__/sequelize.js'),
      config: path.resolve(__dirname, '.storybook/__mocks__/config.js'),
      yargs: path.resolve(__dirname, '.storybook/__mocks__/module.js'),
      child_process: path.resolve(__dirname, './__mocks__/module.js'),
    },
  },
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
        //
        // when using a hosted server, remove the rewrite: line.
        // that rewrite is already done by routing in test/prod deployments
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '/v1/'),
      },
    },
  },
});

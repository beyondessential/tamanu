import { createRequire } from "node:module";
import { dirname, join, resolve } from 'path';
import { mergeConfig } from 'vite';

const require = createRequire(import.meta.url);

function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, "package.json")));
}

// This file needs to support both ESM and CJS, so we can't use `import.meta` or `__dirname` without checking
let dir;
try {
  dir = __dirname;
} catch (e) {
  dir = import.meta.dirname;
}

function getNodeModulePath(workspace, packageName) {
  return dirname(resolve(dir, join(workspace, 'node_modules/', packageName, 'package.json')));
}

function getRootNodeModulePath(packageName) {
  return getNodeModulePath('../../../', packageName);
}

function getWorkspaceNodeModulePath(packageName) {
  return getNodeModulePath('../', packageName);
}

/** @type { import('@storybook/react-vite').StorybookConfig } */
export default {
  framework: getWorkspaceNodeModulePath('@storybook/react-vite'),
  stories: ['../**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  typescript: {
    reactDocgen: false,
  },
  addons: [
    {
      name: getWorkspaceNodeModulePath('@storybook/addon-links'),
      options: { docs: false }, // no mdx
    },
  ],
  async viteFinal(config) {
    // Merge config into the default config
    return mergeConfig(config, {
      build: {
        target: 'es2022', // worker uses top-level await
      },
      define: {
        process: JSON.stringify({
          env: {
            NODE_ENV: process.env.NODE_ENV,
            STORYBOOK: true,
          },
          arch: 'wasm',
          platform: 'web',
        }),
      },
      resolve: {
        alias: {
          buffer: resolve(dir, './__mocks__/buffer.js'),
          sequelize: resolve(dir, './__mocks__/sequelize.js'),
          config: resolve(dir, './__mocks__/config.js'),
          yargs: resolve(dir, './__mocks__/module.js'),
          child_process: resolve(dir, './__mocks__/module.js'),
          crypto: resolve(dir, './__mocks__/crypto.js'),
        },
      },
    });
  },
};

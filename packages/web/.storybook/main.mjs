import { createRequire } from "node:module";
import { dirname, resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { mergeConfig } from 'vite';

const require = createRequire(import.meta.url);

// __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },

  stories: ['../**/*.stories.@(js|jsx|mjs|ts|tsx)'],

  typescript: {
    reactDocgen: false,
  },

  addons: [getAbsolutePath("@storybook/addon-docs")],

  async viteFinal(config) {
    return mergeConfig(config, {
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
          buffer: resolve(__dirname, './__mocks__/buffer.js'),
          sequelize: resolve(__dirname, './__mocks__/sequelize.js'),
          config: resolve(__dirname, './__mocks__/config.js'),
          yargs: resolve(__dirname, './__mocks__/module.js'),
          child_process: resolve(__dirname, './__mocks__/module.js'),
          crypto: resolve(__dirname, './__mocks__/crypto.js'),
        },
      },
    });
  }
};

export default config;

function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, "package.json")));
}

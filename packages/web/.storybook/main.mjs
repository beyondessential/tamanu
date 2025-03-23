import { dirname, join, resolve } from 'path';
import { mergeConfig } from 'vite';

function getAbsolutePath(packageName) {
  return dirname(resolve(__dirname, join('../..', packageName, 'package.json')));
}

/** @type { import('@storybook/react-vite').StorybookConfig } */
export default {
  framework: '@storybook/react-vite',
  stories: ['../**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  typescript: {
    reactDocgen: false,
  },
  features: {
    storyStoreV7: false,
  },
  addons: [
    {
      name: '@storybook/addon-links',
      options: { docs: false }, // no mdx
    },
    '@storybook/addon-links',
  ],
  async viteFinal(config) {
    // Merge custom configuration into the default config
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
        },
      },
    });
  },
};

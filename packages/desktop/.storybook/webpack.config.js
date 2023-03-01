/*
 * Tamanu
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 *
 */
const path = require('path');
const webpack = require('webpack');

/**
 * Custom webpack config for storybook opted into Wwebpack 5
 * @see https://storybook.js.org/docs/react/builders/webpack#extending-storybooks-webpack-config
 */

module.exports = async ({ config }) => {
  /**
   * Pretty odd workaround but prevented changing more core configs
   *  @see https://github.com/vercel/next.js/issues/28774#issuecomment-1264555395 for similar issue
   */
  config.plugins.push(
    new webpack.NormalModuleReplacementPlugin(/^node:/, resource => {
      resource.request = resource.request.replace(/^node:/, '');
    }),
  );
  /**
   * Mock resolve some modules used in shared
   * that are not available in the browser
   */
  config.resolve.fallback = {
    ...config.resolve.fallback,
    os: false,
    fs: false,
    http: false,
    stream: false,
    zlib: false,
  };

  // Mock node global - Buffer
  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: 'buffer',
    }),
  )

  // Allow reading in of config json with comments
  config.module.rules.push({
    test: /\.json$/i,
    loader: 'json5-loader',
    options: {
      esModule: false,
    },
    type: 'javascript/auto',
  });


  // Resolve some modules that are problematic in browser to mocks
  config.resolve.alias = {
    ...config.resolve.alias,
    buffer: path.resolve(__dirname, './__mocks__/buffer.js'),
    sequelize: path.resolve(__dirname, './__mocks__/sequelize.js'),
    config: path.resolve(__dirname, './__mocks__/config.js'),
    electron: require.resolve('./__mocks__/electron.js'),
    yargs: path.resolve(__dirname, './__mocks__/module.js'),
    child_process: path.resolve(__dirname, './__mocks__/module.js'),
  };

  return config;
};

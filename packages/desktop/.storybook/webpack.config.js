/*
 * Tamanu
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 *
 */

const path = require('path');
const webpack = require('webpack');

/**
 * The doc doesn't really mention using webpack.config.js, but .storybook/main.js instead.
 *
 * Nevertheless, configuring the webpack.config.js seems to work fine.
 *
 * @param config
 * @return {Promise<*>}
 * @see https://storybook.js.org/docs/react/configure/webpack
 * @see https://storybook.js.org/docs/react/configure/webpack#using-your-existing-config
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
   * Mock out some modules used in shared
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
  config.resolve.alias = {
    ...config.resolve.alias,
    sequelize: path.resolve(__dirname, './__mocks__/sequelize.js'),
    config: path.resolve(__dirname, './__mocks__/config.js'),
    electron: require.resolve('./__mocks__/electron.js'),
    yargs: path.resolve(__dirname, './__mocks__/module.js'),
    child_process: path.resolve(__dirname, './__mocks__/module.js'),
  };

  return config;
};

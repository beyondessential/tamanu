/*
 * Tamanu
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 *
 */

const path = require('path');

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
   * Fixes npm packages that depend on `fs` module, etc.
   *
   * E.g: "winston" would fail to load without this, because it relies on fs, which isn't available during browser build.
   *
   * @see https://github.com/storybookjs/storybook/issues/4082#issuecomment-495370896
   */
  config.node = {
    fs: 'empty',
    tls: 'empty',
    net: 'empty',
    module: 'empty',
    console: true,
  };

  config.resolve.alias = {
    ...config.resolve.alias,
    'aws-sdk': path.resolve(__dirname, 'moduleMock.js'),
    config: path.resolve(__dirname, 'moduleMock.js'),
    child_process: path.resolve(__dirname, 'moduleMock.js'),
    dns: path.resolve(__dirname, 'moduleMock.js'),
    'pg-hstore': path.resolve(__dirname, 'moduleMock.js'),
    'pg-native': path.resolve(__dirname, 'moduleMock.js'),
    yargs: path.resolve(__dirname, 'moduleMock.js'),
  };

  return config;
};

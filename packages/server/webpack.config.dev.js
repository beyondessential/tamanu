const NodemonPlugin = require('nodemon-webpack-plugin');
const baseConfig = require('./webpack.config');

module.exports = {
  ...baseConfig,
  devtool: 'eval',
  mode: 'development',
  watch: true,
  plugins: [
    ...baseConfig.plugins,
    new NodemonPlugin(),
  ],
};

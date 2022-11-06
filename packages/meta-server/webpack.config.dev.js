const NodemonPlugin = require('nodemon-webpack-plugin');
const baseConfig = require('./webpack.config');

module.exports = {
  ...baseConfig,
  devtool: 'eval',
  target: 'node',
  mode: 'development',
  watch: true,
  plugins: [
    ...baseConfig.plugins,
    new NodemonPlugin({
      delay: 500,
      watch: [
        './dist',
        '../shared',
      ],
    }),
  ],
};

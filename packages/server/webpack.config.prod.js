const baseConfig = require('./webpack.config');

module.exports = {
  ...baseConfig,
  devtool: 'eval',
  mode: 'production',
};

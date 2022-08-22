import baseConfig, { nodemon } from '../../common.webpack.config.mjs';

export default {
  ...baseConfig,
  devtool: 'eval',
  mode: 'development',
  plugins: [nodemon()],
};

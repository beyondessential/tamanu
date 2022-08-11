import baseConfig from '../../common.webpack.config.mjs';
import NodemonPlugin from 'nodemon-webpack-plugin';

export default {
  ...baseConfig,
  devtool: 'eval',
  mode: 'development',
  plugins: [
    new NodemonPlugin({
      delay: 500,
      watch: ['./dist', '../shared'],
    }),
  ],
};

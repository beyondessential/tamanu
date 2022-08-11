import baseConfig from '../../common.webpack.config.mjs';
import NodemonPlugin from 'nodemon-webpack-plugin';

export default {
  ...baseConfig,
  devtool: 'eval',
  mode: 'development',
  plugins: [
    new NodemonPlugin({
      delay: 500,
      watch: ['./dist', './config', '../shared'],
      args: process.env.TAMANU_ARGS ? process.env.TAMANU_ARGS.split(' ') : [],
    }),
  ],
};

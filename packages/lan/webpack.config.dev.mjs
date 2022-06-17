import baseConfig from '../common-configs/webpack.config.mjs';
import NodemonPlugin from 'nodemon-webpack-plugin';

export default {
  ...baseConfig,
  devtool: 'eval',
  mode: 'development',
  plugins: [
    new NodemonPlugin({
      delay: 500,
      watch: ['./dist', '../shared'],
      args: process.env.TAMANU_ARGS ? process.env.TAMANU_ARGS.split(' ') : null,
    }),
  ],
};

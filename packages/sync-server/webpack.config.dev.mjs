import baseConfig, { nodemon } from '../../common.webpack.config.mjs';

const watch = !process.env.NOWATCH;

export default {
  ...baseConfig,
  devtool: 'eval',
  watch,
  mode: 'development',
  plugins: watch
    ? [
        nodemon({
          args: process.env.TAMANU_ARGS ? process.env.TAMANU_ARGS.split(' ') : [],
        }),
      ]
    : [],
};

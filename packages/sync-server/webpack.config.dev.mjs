import { NODE_WEBPACK_CONFIG, nodemon } from '@tamanu/build-tooling';

const watch = !process.env.NOWATCH;

export default {
  ...NODE_WEBPACK_CONFIG,
  mode: 'development',
  devtool: 'eval',
  watch,
  plugins: watch
    ? [
        nodemon({
          args: process.env.TAMANU_ARGS ? process.env.TAMANU_ARGS.split(' ') : [],
        }),
      ]
    : [],
};

import { NODE_WEBPACK_CONFIG, nodemon } from '@tamanu/build-tooling';

const watch = !process.env.NOWATCH;

export default {
  ...NODE_WEBPACK_CONFIG,
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

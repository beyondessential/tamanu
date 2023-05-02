import { NODE_WEBPACK_CONFIG, nodemon } from '@tamanu/build-tooling';

export default {
  ...NODE_WEBPACK_CONFIG,
  devtool: 'eval',
  mode: 'development',
  plugins: [nodemon()],
};

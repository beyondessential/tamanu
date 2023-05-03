import { NODE_WEBPACK_CONFIG_BABEL, nodemon } from '@tamanu/build-tooling';

export default {
  ...NODE_WEBPACK_CONFIG_BABEL,
  devtool: 'eval',
  mode: 'development',
  plugins: [nodemon()],
};

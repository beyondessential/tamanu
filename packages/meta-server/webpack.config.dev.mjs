import { NODE_WEBPACK_CONFIG_SWC, nodemon } from '@tamanu/build-tooling';

export default {
  ...NODE_WEBPACK_CONFIG_SWC,
  devtool: 'eval',
  mode: 'development',
  plugins: [nodemon()],
};

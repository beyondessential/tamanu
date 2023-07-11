import nodeExternals from 'webpack-node-externals';
import NodemonPlugin from 'nodemon-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';

const NODE_WEBPACK_CONFIG = {
  entry: ['core-js/stable', './index.js'],
  externalsPresets: { node: true },
  externals: [nodeExternals({ modulesDir: '../../node_modules' }), nodeExternals()],
  resolve: {
    alias: {
      shared: '@tamanu/shared',
    },
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          ecma: 2020,
          keep_classnames: true,
          keep_fnames: true,
        },
      }),
    ],
  },
  output: {
    clean: true,
    filename: 'app.bundle.js',
  },
  node: {
    // webpack rewrites __dirname to `/` by default, which breaks migrations
    __dirname: true,
  },
};

export const NODE_WEBPACK_CONFIG_BABEL = {
  ...NODE_WEBPACK_CONFIG,
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: new URL('./node_modules/babel-loader', import.meta.url).pathname,
          options: {
            cacheDirectory: true,
            rootMode: 'upward',
          },
        },
      },
      ...(NODE_WEBPACK_CONFIG.module?.rules ?? []),
    ],
    ...(NODE_WEBPACK_CONFIG.module ?? {}),
  },
};

export const NODE_WEBPACK_CONFIG_SWC = {
  ...NODE_WEBPACK_CONFIG,
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: new URL('./node_modules/swc-loader', import.meta.url).pathname,
        },
      },
      ...(NODE_WEBPACK_CONFIG.module?.rules ?? []),
    ],
    ...(NODE_WEBPACK_CONFIG.module ?? {}),
  },
};

export function nodemon(options) {
  const nm = new NodemonPlugin({
    delay: 500,
    watch: ['./dist', '../shared/dist'],
    ...options,
  });
  nm.isWebpackWatching = true;
  return nm;
}

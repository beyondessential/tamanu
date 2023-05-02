import nodeExternals from 'webpack-node-externals';
import NodemonPlugin from 'nodemon-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';

export const NODE_WEBPACK_CONFIG = {
  entry: ['core-js/stable', './index.js'],
  externalsPresets: { node: true },
  externals: [nodeExternals({ modulesDir: '../../node_modules' }), nodeExternals()],
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
    ],
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
};

export function nodemon(options) {
  const nm = new NodemonPlugin({
    delay: 500,
    watch: ['./dist', '../shared'],
    ...options,
  });
  nm.isWebpackWatching = true;
  return nm;
}

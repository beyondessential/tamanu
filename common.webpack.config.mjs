import NodemonPlugin from 'nodemon-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import nodeExternals from 'webpack-node-externals';

// we assume a Node.js environment, desktop has its own config


export default {
  entry: ['core-js/stable', './index.js'],
  externalsPresets: { node: true },
  externals: [nodeExternals({ modulesDir: '../../node_modules' }), nodeExternals()],
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
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
  const nodemon = new NodemonPlugin({
    delay: 500,
    watch: ['./dist', '../shared'],
    ...options,
  });
  nodemon.isWebpackWatching = true;
  return nodemon;
}

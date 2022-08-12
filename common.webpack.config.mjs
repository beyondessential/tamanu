import nodeExternals from 'webpack-node-externals';
import NodemonPlugin from 'nodemon-webpack-plugin';

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
            rootMode: 'upward',
          },
        },
      },
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

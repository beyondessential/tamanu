const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  target: 'node',
  entry: ['@babel/polyfill', './index.js'],
  externals: [nodeExternals({ modulesDir: '../../node_modules' }), nodeExternals()],
  plugins: [new CleanWebpackPlugin(), new webpack.optimize.OccurrenceOrderPlugin()],
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
    path: path.resolve(__dirname, 'dist'),
    filename: 'app.bundle.js',
  },
};

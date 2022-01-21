const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  target: 'node',
  entry: ['@babel/polyfill', './index.js'],
  externals: [nodeExternals({ modulesDir: '../../node_modules' }), nodeExternals()],
  plugins: [new CleanWebpackPlugin(), new webpack.optimize.OccurrenceOrderPlugin()],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'app'),
      shared: path.resolve(__dirname, '..', 'shared'),
    },
  },
  module: {
    rules: [
      {
        test: /\.ttf$/,
        use: [
          {
            loader: 'ttf-loader',
            options: {
              name: './font/[hash].[ext]',
            },
          },
        ],
      },
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
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

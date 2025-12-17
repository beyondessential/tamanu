const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const workspaceRoot = path.resolve(__dirname, '../..');
const projectRoot = __dirname;

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    blockList: exclusionList([
      new RegExp(`^${path.join(workspaceRoot, 'node_modules', 'react').replace(/[/\\]/g, '\\/')}\\/.*$`),
      new RegExp(`^${path.join(workspaceRoot, 'node_modules', 'react-native-svg').replace(/[/\\]/g, '\\/')}\\/.*$`),
    ]),
    extraNodeModules: {
      'react': path.join(projectRoot, 'node_modules', 'react'),
    },
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

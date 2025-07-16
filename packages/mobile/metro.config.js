const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { resolve } = require('path');
const getWorkspaces = require('get-yarn-workspaces');

const config = {
  watchFolders: [
    resolve(__dirname, 'node_modules'),
    resolve(__dirname, '../../node_modules'),
    ...getWorkspaces(),
  ],
  resolver: {
    unstable_enableSymlinks: true // Turn on symlink support
  }
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
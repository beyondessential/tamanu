/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const path = require('path');

const { FileStore } = require('metro-cache');

// still works with npm
const getWorkspaces = require('get-yarn-workspaces');

const workspaces = getWorkspaces(__dirname);

module.exports = {
  projectRoot: path.resolve(__dirname, '.'),

  watchFolders: [path.resolve(__dirname, '../../node_modules'), ...workspaces],

  resolver: {
    // https://github.com/facebook/metro/issues/1#issuecomment-453450709
    extraNodeModules: new Proxy(
      {},
      {
        get: (target, name) => path.join(process.cwd(), `node_modules/${name}`),
      },
    ),
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'cjs', 'json'],
  },

  // http://facebook.github.io/react-native/blog/2019/03/12/releasing-react-native-059#faster-app-launches-with-inline-requires
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },

  cacheStores: [
    new FileStore({
      root: path.join(__dirname, 'metro-cache'),
    }),
  ],
};

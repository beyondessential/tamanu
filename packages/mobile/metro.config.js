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
    extraNodeModules: {
      ...new Proxy(
        {},
        {
          get: (target, name) => path.join(process.cwd(), `node_modules/${name}`),
        },
      ),
      // Add monorepo packages to Metro's module resolution
      '@tamanu/shared': path.resolve(__dirname, '../shared/dist/cjs'),
      '@tamanu/constants': path.resolve(__dirname, '../constants/dist/cjs'),
      '@tamanu/api-client': path.resolve(__dirname, '../api-client/dist/cjs'),
    },
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'cjs', 'json'],
    resolverMainFields: ['react-native', 'browser', 'main'],
    platforms: ['ios', 'android', 'native', 'web'],
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

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const { FileStore } = require('metro-cache');

// still works with npm workspaces
const getWorkspaces = require('get-yarn-workspaces');

const workspaces = getWorkspaces(__dirname);

const config = {
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

  serializer: {
    // @react-native/metro-config resolves this from root node_modules which
    // has no react-native in this monorepo setup; resolve from here instead.
    getModulesRunBeforeMainModule: () => [
      require.resolve('react-native/Libraries/Core/InitializeCore'),
    ],
  },

  transformer: {
    getTransformOptions: async () => ({
      transform: {
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

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

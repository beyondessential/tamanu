/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const path = require('path');
const fs = require('fs');

const { FileStore } = require('metro-cache');

// still works with npm
const getWorkspaces = require('get-yarn-workspaces');

const workspaces = getWorkspaces(__dirname);

// Configuration for subpath exports
const subpathConfig = {
  '@tamanu/shared': {
    basePath: '../shared',
    patterns: [
      { subpath: 'errors', file: 'dist/cjs/errors.js' },
      { subpath: '*', file: 'dist/cjs/{subpath}/index.js' }
    ]
  },
  '@tamanu/constants': {
    basePath: '../constants',
    patterns: [
      { subpath: '*', file: 'dist/cjs/{subpath}.js' }
    ]
  }
};

// Generic resolver for subpath exports
const resolveSubpath = (moduleName) => {
  for (const [packageName, config] of Object.entries(subpathConfig)) {
    if (moduleName.startsWith(packageName + '/')) {
      const subpath = moduleName.replace(packageName + '/', '');
      const basePath = path.resolve(__dirname, config.basePath);
      
      for (const pattern of config.patterns) {
        let filePath;
        if (pattern.subpath === '*') {
          filePath = path.resolve(basePath, pattern.file.replace('{subpath}', subpath));
        } else if (pattern.subpath === subpath) {
          filePath = path.resolve(basePath, pattern.file);
        }
        
        if (filePath && fs.existsSync(filePath)) {
          return {
            filePath,
            type: 'sourceFile',
          };
        }
      }
    }
  }
  return null;
};

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
    resolverMainFields: ['react-native', 'browser', 'main'],
    platforms: ['ios', 'android', 'native', 'web'],
    resolveRequest: (context, moduleName, platform) => {
      const subpathResult = resolveSubpath(moduleName);
      if (subpathResult) {
        return subpathResult;
      }
      // Let Metro handle the rest
      return context.resolveRequest(context, moduleName, platform);
    },
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

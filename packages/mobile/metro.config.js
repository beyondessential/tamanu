const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const fs = require('fs');
const path = require('path');

const { FileStore } = require('metro-cache');

// still works with npm workspaces
const getWorkspaces = require('get-yarn-workspaces');

const workspaces = getWorkspaces(__dirname);

const mobileNodeModules = path.resolve(__dirname, 'node_modules');
const rootNodeModules = path.resolve(__dirname, '../../node_modules');

function resolveNodeModule(name) {
  for (const nodeModulesDir of [mobileNodeModules, rootNodeModules]) {
    const modulePath = path.join(nodeModulesDir, name);
    const pkgJsonPath = path.join(modulePath, 'package.json');
    if (!fs.existsSync(pkgJsonPath)) {
      continue;
    }

    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    const mainEntry = path.join(modulePath, pkg.main || 'index.js');
    if (fs.existsSync(mainEntry)) {
      return modulePath;
    }
  }

  return path.join(mobileNodeModules, name);
}

const config = {
  projectRoot: path.resolve(__dirname, '.'),

  watchFolders: [rootNodeModules, ...workspaces],

  resolver: {
    // Prefer packages/mobile/node_modules, but fall back to the workspace root
    // when a hoisted package copy is incomplete (e.g. source-map).
    extraNodeModules: new Proxy(
      {},
      {
        get: (target, name) => resolveNodeModule(String(name)),
      },
    ),
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'cjs', 'json'],
    // Force packages that exist in both root and mobile node_modules to always
    // resolve from mobile, preventing duplicate native component registration
    // and multiple React copies in the bundle.
    resolveRequest: (context, moduleName, platform) => {
      const dedupedPackages = [
        'react',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-native',
        'react-native-svg',
      ];
      if (dedupedPackages.includes(moduleName)) {
        return context.resolveRequest(
          { ...context, originModulePath: path.resolve(__dirname, 'index.js') },
          moduleName,
          platform,
        );
      }
      return context.resolveRequest(context, moduleName, platform);
    },
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

const path = require('path');

module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        // the upgrade to inline requires for RN 0.64 is skipped
        // turning on inlineRequires will cause the database
        // connection to fail silently
        inlineRequires: false,
      },
    }),
    minifierPath: "metro-minify-terser",
    minifierConfig: {
      keep_classnames: true,
      keep_fnames: true,
      mangle: {
        keep_classnames: true,
        keep_fnames: true,
      },
    },
  },
  resolver: {
    extraNodeModules: {
      '@mui/styled-engine': path.resolve(__dirname, 'node_modules/@mui/styled-engine-sc'),
    },
  },
};

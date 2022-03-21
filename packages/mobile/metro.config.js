
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
};

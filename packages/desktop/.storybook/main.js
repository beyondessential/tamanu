module.exports = {
  features: {
    babelModeV7: true
  },
  webpackFinal: config => {
    config.resolve.alias['electron'] = require.resolve('./__mocks__/electron.js');
    return config;
  },
};

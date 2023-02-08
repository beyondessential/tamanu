module.exports = {
  features: {
    babelModeV7: true,
  },
  addons: ['@storybook/addon-links', '@storybook/addon-actions', '@storybook/addon-controls'],
  stories: ['../stories/**/*.stories.@(js|mdx)'],
  core: {
    builder: 'webpack5',
  },
  webpackFinal: async config => {
    // Another niche workaround to fix DefinePlugin Conflicting 'process.env.NODE_ENV'
    // Define plugin inside webpack.config.js does not work for some reason
    const definePlugin = config.plugins.find(x => x.constructor.name === 'DefinePlugin');
    definePlugin.definitions['NODE_ENV'] = JSON.stringify('test');
    definePlugin.definitions['process.env.NODE_ENV'] = JSON.stringify('test');
    config.mode = 'none';
    return config;
  },
};

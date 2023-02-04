module.exports = {
  features: {
    babelModeV7: true,
  },
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-actions',
    '@storybook/addon-controls',
  ],
  stories: ['../stories/**/*.stories.@(js|mdx)'],
  core: {
    builder: 'webpack5',
  },
  env: (config) => ({
    ...config,
   NODE_ENV: 'test',
  }),
};

module.exports = {
  features: {
    babelModeV7: true,
  },
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-actions',
  ],
  stories: ['../stories/**/*.stories.@(js|mdx)'],
  core: {
    builder: 'webpack5',
  },
};

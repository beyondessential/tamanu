export default {
  framework: '@storybook/react-vite',
  stories: ['../stories/*.stories.@(js|jsx|mjs|ts|tsx)'],
  typescript: {
    reactDocgen: false,
  },
  features: {
    storyStoreV7: false,
  },
  addons: [
    {
      name: '@storybook/addon-essentials',
      options: { docs: false }, // no mdx
    },
    '@storybook/addon-links',
  ],
};

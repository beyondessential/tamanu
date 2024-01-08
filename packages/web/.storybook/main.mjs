export default {
  framework: '@storybook/react-vite',
  stories: ['../**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  typescript: {
    reactDocgen: 'react-docgen',
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

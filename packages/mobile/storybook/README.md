# Storybook Configuration

Storybook in React-Native runs differently than in the web. I had to use react-native-story-loader lib to find and load files.

## How it works

The react-native-story-loader lib generates a file storyLoader.js and exports a function loadStories with the path of all *.stories files.

Troubleshoot:

- Any problems with storybook first attempt is to run "yarn run storybook" to try to map all files again.
- Remove storyLoader.js and run command again.

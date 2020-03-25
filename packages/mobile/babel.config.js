module.exports = {
  presets: [
    'module:metro-react-native-babel-preset',
  ],
  plugins: [
    ['module-resolver', {
      root: ['./App'],
      extensions: ['.tsx'],
      alias: {
        '/styled': './App/styled',
        '/components': './App/components',
        '/interfaces': './App/interfaces',
        '/helpers': './App/helpers',
        '/navigation': './App/navigation',
        '/containers': './App/containers',
        '/store': './App/store',
        '/models': './App/models',
        '/services': './App/services',
      },
    },
    ],
  ],
};

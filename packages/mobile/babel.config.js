module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        extensions: ['.tsx', '.json'],
        alias: {
          '/styled': './App/ui/styled',
          '/components': './App/components',
          '/interfaces': './App/interfaces',
          '/helpers': './App/helpers',
          '/navigation': './App/navigation',
          '/containers': './App/containers',
          '/store': './App/ui/store',
          '/models': './App/models',
          '/services': './App/services',
          '/root': './',
        },
      },
    ],
  ],
};

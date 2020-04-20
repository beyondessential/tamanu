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
          '/components': './App/ui/components',
          '/interfaces': './App/ui/interfaces',
          '/helpers': './App/ui/helpers',          
          '/navigation': './App/ui/navigation',
          '/containers': './App/ui/containers',
          '/store': './App/ui/store',
          '/models': './App/ui/models',
          '/services': './App/ui/services',          
          '/root': './',
        },
      },
    ],
  ],
};

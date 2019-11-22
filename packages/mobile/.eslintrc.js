module.exports = {
  root: true,
  extends: [
    '@react-native-community',
    '@beyondessential/eslint-config-beyondessential',
  ],
  env: {
    jest: true,
    jasmine: true,
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts', '.tsx', '.stories'],
      },
    },
    rules: {
      'import/no-unresolved': [2, { caseSensitive: false }],
    },
  },
};

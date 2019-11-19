module.exports = {
  root: true,
  extends: [
    '@beyondessential/eslint-config-beyondessential',
    '@react-native-community',
  ],
  env: {
    jest: true,
    jasmine: true,
  },
  rules: {
    'import/no-unresolved': [2, { caseSensitive: false }],
  },
};

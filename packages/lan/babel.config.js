module.exports = api => {
  api.cache(true);

  return {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: { node: 'current' },
          bugfixes: true,
          useBuiltIns: 'usage',
          corejs: 2,
        },
      ],
    ],
    plugins: [
      ['@babel/plugin-proposal-decorators', { version: '2022-03' }],
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-class-static-block', // for decorators
      '@babel/plugin-proposal-export-default-from',
      '@babel/plugin-proposal-logical-assignment-operators',
    ],
  };
};

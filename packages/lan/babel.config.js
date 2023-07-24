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
      '@babel/preset-react',
    ],
    plugins: [
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-export-default-from',
      '@babel/plugin-proposal-logical-assignment-operators',
    ],
  };
};

module.exports = api => {
  // Cache permanently. Safe because this setting only applies per-process.
  // (ie restarting the build will reset the cache)
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
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-export-default-from',
      '@babel/plugin-proposal-logical-assignment-operators',
    ],
  };
};

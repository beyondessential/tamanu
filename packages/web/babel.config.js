const getBaseConfig = require('../../babel.config');

module.exports = api => {
  const config = getBaseConfig(api);
  config.presets.push([
    '@babel/preset-react',
    {
      loose: true,
    },
  ]);
  config.plugins.push(
    '@babel/plugin-transform-classes',
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-transform-private-methods',
  );

  // Solves spurious "loose option must be the same across plugins X Y and Z" errors
  // ...even though we don't set loose anywhere ourselves, apparently the preset does
  config.plugins = config.plugins.map(name => [name, { loose: true }]);
  return config;
};

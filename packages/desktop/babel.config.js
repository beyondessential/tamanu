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
  config.plugins = config.plugins.map(name => [name, { loose: true }]);
  return config;
};

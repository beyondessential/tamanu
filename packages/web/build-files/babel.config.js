const getBaseConfig = require('../../babel.config');

module.exports = api => {
  const config = getBaseConfig(api);
  const { presets, plugins } = config;
  config.presets = presets.concat('@babel/preset-react');
  config.plugins = plugins.concat([
    '@babel/plugin-transform-classes',
    '@babel/plugin-proposal-optional-chaining',
  ]);
  return config;
};

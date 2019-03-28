const baseConfig = require('../../babel.config');

module.exports = api => {
  const { presets, plugins, ...config } = baseConfig(api);

  return {
    presets: presets.concat('@babel/preset-react'),
    plugins: plugins.concat('@babel/plugin-transform-classes'),
    ...config
  };
};


module.exports = api => {

  api.cache(false);

  return {
    presets: [
      [ "@babel/preset-env", { 
        targets: { node: 10 },
        useBuiltIns: "usage",
        corejs: 2,
      } ],
    ],
    plugins: [
      "@babel/plugin-proposal-function-bind",     
      "@babel/plugin-proposal-class-properties",
      "@babel/plugin-proposal-export-default-from",
    ],
  };
};

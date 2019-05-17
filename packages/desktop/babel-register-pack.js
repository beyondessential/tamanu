require('@babel/register')({
  ignore: [/node_modules/],
  rootMode: 'upward',
});

var webpack = require('webpack');
var config = require('./' + process.env.CONFIG);

webpack(
  config.default,
  (err, stats) => {
    if (err || stats.hasErrors()) {
      console.log('Error running webpack');
      console.log(err);
      console.log(stats.toJson().errors);
    }
  },
);

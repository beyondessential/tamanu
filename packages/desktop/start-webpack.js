const webpack = require('webpack');

const config = require(`./${process.env.CONFIG}`);

webpack(config.default, (err, stats) => {
  if (err || stats.hasErrors()) {
    console.log('Error running webpack');
    console.log(err);
    console.log(stats.toJson().errors);
  }
});

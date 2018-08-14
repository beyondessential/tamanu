const fs = require('fs');

let config = {};
try {
  config = fs.readFileSync('/run/secrets/tamanu_lan_config');
  config = JSON.parse(config.toString());
} catch (err) {
  if (process.env.NODE_ENV === 'production') throw new Error(err);
}

module.exports = config;

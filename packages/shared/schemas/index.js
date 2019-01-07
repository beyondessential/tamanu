const fs = require('fs');
const path = require('path');
const defaults = require('./defaults');
const version = 16;

const schemas = [];
fs.readdirSync(__dirname).forEach((file) => {
  if (file === 'index.js' || file === 'defaults.js') return;
  schemas.push(require(path.join(__dirname, file)));
});

module.exports = { schemas, version, defaults };

const fs = require('fs');
const path = require('path');

const mods = [];
fs.readdirSync(__dirname).forEach((file) => {
  if (file === 'index.js' || file === 'defaults.js') return;
  mods.push(require(path.join(__dirname, file)));
});

module.exports = mods;

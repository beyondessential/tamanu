const fs = require('fs');
const path = require('path');

const mods = []; // [require('./allergy'), require('./answer'), require('./appointment')];
fs.readdirSync(__dirname).forEach((file) => {
  /* If its the current file ignore it */
  if (file === 'index.js') return;
  /* Store module with its name (from filename) */
  mods.push(require(path.join(__dirname, file)));
});

module.exports = mods;

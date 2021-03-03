const Sequelize = require('sequelize');

module.exports = {
  up: async () => (query) => {
    // TODO: replace with SQL dump of current table definitions
    console.log(query);
    console.log('up');
  },
  down: async () => (query) => {
    console.log(query);
    console.log('down');
  },
};

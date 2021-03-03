const Sequelize = require('sequelize');

module.exports = {
  up: async () => (query) => {
    // TODO: this won't be in final PR
    console.log('up test');
  },
  down: async () => (query) => {
    console.log('down test');
  },
};

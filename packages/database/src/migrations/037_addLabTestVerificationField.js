const Sequelize = require('sequelize');

export default {
  up: async (query) => {
    await query.addColumn('lab_tests', 'verification', {
      type: Sequelize.STRING,
    });
  },

  down: async (query) => {
    await query.removeColumn('lab_tests', 'verification');
  },
};

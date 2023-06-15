const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.changeColumn('program_data_elements', 'default_options', {
      type: Sequelize.TEXT,
    });
  },
  down: async query => {
    await query.changeColumn('program_data_elements', 'default_options', {
      type: Sequelize.STRING,
    });
  },
};

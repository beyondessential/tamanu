const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('survey_responses', 'result_text', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },
  down: async query => {
    await query.removeColumn('survey_responses', 'result_text');
  },
};

const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('patients', 'title', Sequelize.STRING);
    await query.addColumn('patients', 'additional_details', Sequelize.TEXT);
    await query.addColumn('patients', 'ethnicity_id', {
      type: Sequelize.STRING,
      references: {
        model: 'reference_data',
        key: 'id',
      },
    });

    await query.addColumn('surveys', 'survey_type', {
      type: Sequelize.STRING,
      defaultValue: 'programs',
    });
  },
  down: async query => {
    await query.removeColumn('patients', 'title');
    await query.removeColumn('patients', 'additional_details');
    await query.removeColumn('patients', 'ethnicity_id');
    await query.removeColumn('surveys', 'survey_type');
  },
};

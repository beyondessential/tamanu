const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('lab_tests', 'lab_test_method_id', {
      type: Sequelize.STRING,
      references: {
        model: 'reference_data',
        key: 'id',
      },
    });
    await query.addColumn('lab_tests', 'laboratory_officer', {
      type: Sequelize.STRING,
    });
    await query.addColumn('lab_tests', 'completed_date', {
      type: Sequelize.DATE,
    });
  },

  down: async query => {
    await query.removeColumn('lab_tests', 'lab_test_method_id');
    await query.removeColumn('lab_tests', 'laboratory_officer');
    await query.removeColumn('lab_tests', 'completed_date');
  },
};

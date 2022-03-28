const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('certificate_notifications', 'lab_test_id', {
      type: Sequelize.STRING,
      allowNull: true,
      references: { model: 'lab_tests', key: 'id' },
    });
  },
  down: async query => {
    await query.removeColumn('certificate_notifications', 'lab_test_id');
  },
};

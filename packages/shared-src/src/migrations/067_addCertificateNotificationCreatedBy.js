const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('certificate_notifications', 'created_by', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
  down: async query => {
    await query.removeColumn('certificate_notifications', 'created_by');
  },
};

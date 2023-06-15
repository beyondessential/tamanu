const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    // Default to true for existing records
    await query.addColumn('administered_vaccines', 'consent', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    });
    // Update default to null for future records
    await query.changeColumn('administered_vaccines', 'consent', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: null,
    });
  },
  down: async query => {
    await query.removeColumn('administered_vaccines', 'consent');
  },
};

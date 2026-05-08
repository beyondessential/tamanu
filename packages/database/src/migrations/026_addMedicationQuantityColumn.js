const sequelize = require('sequelize');

export default {
  up: async (query) => {
    await query.addColumn('encounter_medications', 'quantity', {
      type: sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },
  down: async (query) => {
    await query.removeColumn('encounter_medications', 'quantity');
  },
};

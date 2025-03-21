const Sequelize = require('sequelize');

export default {
  up: async (query) => {
    await query.addColumn('surveys', 'is_sensitive', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
  },
  down: async (query) => {
    await query.removeColumn('surveys', 'is_sensitive');
  },
};

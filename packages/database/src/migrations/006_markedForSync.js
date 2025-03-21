const Sequelize = require('sequelize');

export default {
  up: async (query) => {
    await query.addColumn('patients', 'marked_for_sync', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },
  down: async (query) => {
    await query.removeColumn('patients', 'marked_for_sync');
  },
};

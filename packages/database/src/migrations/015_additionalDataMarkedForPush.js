const Sequelize = require('sequelize');

export default {
  up: async (query) => {
    await query.addColumn('patient_additional_data', 'marked_for_push', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  },
  down: async (query) => {
    await query.removeColumn('patient_additional_data', 'marked_for_push');
  },
};

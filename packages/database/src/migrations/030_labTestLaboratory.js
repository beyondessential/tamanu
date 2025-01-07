const Sequelize = require('sequelize');

export default {
  up: async (query) => {
    await query.addColumn('lab_requests', 'lab_test_laboratory_id', {
      type: Sequelize.STRING,
      references: {
        model: 'reference_data',
        key: 'id',
      },
    });
  },

  down: async (query) => {
    await query.removeColumn('lab_requests', 'lab_test_laboratory_id');
  },
};

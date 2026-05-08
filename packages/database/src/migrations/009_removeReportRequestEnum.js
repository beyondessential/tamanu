const Sequelize = require('sequelize');

const REPORT_REQUEST_STATUS = ['Received', 'Processed', 'Error'];

export default {
  up: async (query) => {
    await query.changeColumn('report_requests', 'status', {
      type: Sequelize.STRING(31),
      allowNull: false,
    });
  },

  down: async (query) => {
    await query.changeColumn('report_requests', 'status', {
      type: Sequelize.ENUM(REPORT_REQUEST_STATUS),
    });
  },
};

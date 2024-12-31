const Sequelize = require('sequelize');

export default {
  up: async (query) => {
    await query.addColumn('referrals', 'status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'pending',
    });
  },
  down: async (query) => {
    await query.removeColumn('referrals', 'status');
  },
};

const sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('encounters', 'recorder_id', {
      type: sequelize.STRING,
      references: {
        model: 'users',
        key: 'id',
      },
    });
  },
  down: async query => {
    await query.removeColumn('encounters', 'recorder_id');
  },
};

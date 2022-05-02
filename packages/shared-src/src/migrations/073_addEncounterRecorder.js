const sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('encounters', 'recorder_id', {
      type: sequelize.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    });
    await query.sequelize.query('UPDATE encounters SET recorder_id = examiner_id');
  },
  down: async query => {
    await query.removeColumn('encounters', 'recorder_id');
  },
};

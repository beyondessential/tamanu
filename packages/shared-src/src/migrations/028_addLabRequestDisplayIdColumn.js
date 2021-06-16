const sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('lab_request', 'display_id', {
      type: sequelize.STRING, // Should we enforce the format at db level?
      allowNull: false,
    });
  },
  down: async query => {
    await query.removeColumn('lab_request', 'display_id');
  },
};

const sequelize = require('sequelize');

module.exports = {
  up: async query => {
    // await query.bulkDelete('lab_requests', {});
    await query.addColumn('lab_requests', 'display_id', {
      type: sequelize.STRING, // Should we enforce the format at db level?
      allowNull: true, // (just for keeping requests in dev)
    });
  },
  down: async query => {
    await query.removeColumn('lab_requests', 'display_id');
  },
};

const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.bulkDelete('sync_metadata', {}); // delete all sync metadata - means a full resync
    await query.changeColumn('sync_metadata', 'channel', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });
  },

  down: async query => {
    await query.changeColumn('sync_metadata', 'channel', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};

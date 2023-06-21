const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.changeColumn('user_feature_flags_caches', 'feature_flags', {
      type: Sequelize.TEXT,
      allowNull: false,
    });
  },
  down: async query => {
    await query.changeColumn('user_feature_flags_caches', 'feature_flags', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};

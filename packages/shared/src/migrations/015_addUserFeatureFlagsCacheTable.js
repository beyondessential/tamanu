const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.createTable(
      'user_feature_flags_cache',
      {
        id: {
          type: Sequelize.STRING,
          defaultValue: Sequelize.UUIDV4,
          allowNull: false,
          primaryKey: true,
        },
        featureFlags: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        user_id: {
          type: Sequelize.STRING,
          references: {
            model: 'users',
            key: 'id',
          },
        },
      },
      {},
    );
  },
  down: async query => {
    await query.dropTable('user_feature_flags_cache');
  },
};

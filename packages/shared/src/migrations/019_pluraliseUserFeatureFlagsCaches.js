const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.dropTable('user_feature_flags_cache');
    await query.createTable(
      'user_feature_flags_caches',
      {
        id: {
          type: Sequelize.STRING,
          defaultValue: Sequelize.UUIDV4,
          allowNull: false,
          primaryKey: true,
        },
        feature_flags: {
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
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
        deleted_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
      },
      {},
    );
  },
  down: async query => {
    await query.dropTable('user_feature_flags_caches');
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
};

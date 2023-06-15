const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.createTable(
      'user_facilities',
      {
        id: {
          type: Sequelize.STRING,
          defaultValue: Sequelize.UUIDV4,
          allowNull: false,
          primaryKey: true,
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
        facility_id: {
          type: Sequelize.STRING,
          references: {
            model: 'reference_data',
            key: 'id',
          },
        },
        user_id: {
          type: Sequelize.STRING,
          references: {
            model: 'users',
            key: 'id',
          },
        },
        marked_for_push: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        pushed_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        pulled_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
      },
      {
        uniqueKeys: {
          user_location_unique: {
            fields: ['user_id', 'facility_id'],
          },
        },
      },
    );
  },
  down: async query => {
    await query.dropTable('user_facilities');
  },
};

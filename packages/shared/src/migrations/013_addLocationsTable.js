const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.createTable(
      'locations',
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
        code: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        facility_id: {
          type: Sequelize.STRING,
          references: {
            model: 'reference_data',
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
        indexes: [
          {
            fields: ['name'],
          },
        ],
      },
    );
  },
  down: async query => {
    await query.dropTable('locations');
  },
};

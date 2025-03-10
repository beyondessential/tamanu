const Sequelize = require('sequelize');

export default {
  up: async (query) => {
    await query.createTable(
      'facilities',
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
        division: {
          type: Sequelize.STRING,
        },
        type: {
          type: Sequelize.STRING,
        },
      },
      {
        indexes: [
          { unique: true, fields: ['code'] },
          { unique: true, fields: ['name'] },
        ],
      },
    );
  },
  down: async (query) => {
    await query.dropTable('facilities');
  },
};

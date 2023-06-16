const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.createTable('imaging_request_area', {
      id: {
        type: Sequelize.STRING,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      imaging_request_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'imaging_requests',
          key: 'id',
        },
      },
      area_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'reference_data',
          key: 'id',
        },
      },
    });
  },
  down: async query => {
    await query.dropTable('imaging_request_area');
  },
};

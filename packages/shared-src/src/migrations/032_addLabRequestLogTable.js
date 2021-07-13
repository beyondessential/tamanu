const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.createTable('lab_request_log', {
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
      lab_request_id: {
        type: Sequelize.STRING,
        references: {
          model: 'lab_requests',
          key: 'id',
        },
      },
      updated_by_id: {
        type: Sequelize.STRING,
        references: {
          model: 'users',
          key: 'id',
        },
      },
    });
  },
  down: async query => {
    await query.dropTable('lab_request_log');
  },
};

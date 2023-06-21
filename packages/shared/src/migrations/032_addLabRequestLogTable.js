const Sequelize = require('sequelize');

const LAB_REQUEST_STATUSES = {
  RECEPTION_PENDING: 'reception_pending',
  RESULTS_PENDING: 'results_pending',
  TO_BE_VERIFIED: 'to_be_verified',
  VERIFIED: 'verified',
  PUBLISHED: 'published',
};

module.exports = {
  up: async query => {
    await query.createTable('lab_request_logs', {
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
      status: {
        type: Sequelize.ENUM(Object.values(LAB_REQUEST_STATUSES)),
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
    await query.dropTable('lab_request_logs');
  },
};

const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.createTable('certificate_notifications', {
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
      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      require_signing: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      patient_id: {
        type: Sequelize.STRING,
        references: { model: 'patients', key: 'id' },
      },
      forward_address: {
        type: Sequelize.STRING,
        defaultValue: null,
      },
      marked_for_push: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      is_pushing: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      pushed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      pulled_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },
  down: async query => {
    await query.dropTable('certificate_notifications');
  },
};

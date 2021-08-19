const Sequelize = require('sequelize');
const { APPOINTMENT_TYPES, APPOINTMENT_STATUSES } = require('../constants');

module.exports = {
  up: async query => {
    await query.createTable('appointments', {
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
      startTime: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      endTime: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      patient_id: {
        type: Sequelize.STRING,
        references: {
          model: 'patients',
          key: 'id',
        },
      },
      clinician_id: {
        type: Sequelize.STRING,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      location_id: {
        type: Sequelize.STRING,
        references: {
          model: 'locations',
          key: 'id',
        },
      },
      type: {
        type: Sequelize.ENUM(Object.values(APPOINTMENT_TYPES)),
        defaultValue: APPOINTMENT_TYPES.STANDARD,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: APPOINTMENT_STATUSES.CONFIRMED,
        allowNull: false,
      },
    });
  },
  down: async query => {
    await query.dropTable('appointments');
  },
};

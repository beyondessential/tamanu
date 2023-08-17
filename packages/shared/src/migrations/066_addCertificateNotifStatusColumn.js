const Sequelize = require('sequelize');
const { CERTIFICATE_NOTIFICATION_STATUSES } = require('@tamanu/constants');

module.exports = {
  up: async query => {
    // Default to processed for previously existing records
    await query.addColumn('certificate_notifications', 'status', {
      type: Sequelize.STRING,
      defaultValue: CERTIFICATE_NOTIFICATION_STATUSES.PROCESSED,
      allowNull: false,
    });
    // Update default to queued for future records
    await query.changeColumn('certificate_notifications', 'status', {
      type: Sequelize.STRING,
      defaultValue: CERTIFICATE_NOTIFICATION_STATUSES.QUEUED,
      allowNull: false,
    });

    await query.addColumn('certificate_notifications', 'error', {
      type: Sequelize.TEXT,
      defaultValue: null,
    });
  },
  down: async query => {
    await query.removeColumn('certificate_notifications', 'status');
    await query.removeColumn('certificate_notifications', 'error');
  },
};
